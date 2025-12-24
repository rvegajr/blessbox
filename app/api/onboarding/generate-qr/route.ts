import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    // Backward compatibility:
    // - Older clients used `formConfigId` (same thing as qrCodeSetId / qr_code_sets.id)
    // - Some clients used `qrCodes` instead of `entryPoints`
    // - Some clients used a single `qrLabel` (we convert it into a single entry point)
    const qrCodeSetId =
      (typeof body.qrCodeSetId === 'string' && body.qrCodeSetId.trim())
        ? body.qrCodeSetId.trim()
        : (typeof body.formConfigId === 'string' && body.formConfigId.trim())
          ? body.formConfigId.trim()
          : undefined;

    const slugify = (input: string) =>
      String(input || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    let entryPoints =
      Array.isArray(body.entryPoints) ? body.entryPoints
        : Array.isArray(body.qrCodes) ? body.qrCodes
          : undefined;

    if ((!Array.isArray(entryPoints) || entryPoints.length === 0) && typeof body.qrLabel === 'string' && body.qrLabel.trim()) {
      const raw = body.qrLabel.trim();
      entryPoints = [{ label: raw, slug: slugify(raw) || raw }];
    }

    // Validate inputs
    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(entryPoints) || entryPoints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one entry point is required' },
        { status: 400 }
      );
    }

    // Validate entry points structure
    for (const entryPoint of entryPoints) {
      if (!entryPoint.label || !entryPoint.slug) {
        return NextResponse.json(
          { success: false, error: 'Each entry point must have label and slug' },
          { status: 400 }
        );
      }
    }

    const db = getDbClient();

    // Check if organization exists
    const orgResult = await db.execute({
      sql: `SELECT id, name, custom_domain FROM organizations WHERE id = ?`,
      args: [organizationId],
    });

    if (orgResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organization = orgResult.rows[0] as any;
    const orgSlug =
      (typeof organization.custom_domain === 'string' && organization.custom_domain.trim()
        ? organization.custom_domain.trim()
        : organization.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

    // Get or create QR code set
    const now = new Date().toISOString();
    let qrSetId: string;

    if (typeof qrCodeSetId === 'string' && qrCodeSetId.trim()) {
      // Use provided QR code set ID (the onboarding form-config ID is the qr_code_sets id)
      qrSetId = qrCodeSetId.trim();
      const existingSet = await db.execute({
        sql: `SELECT id FROM qr_code_sets WHERE id = ? AND organization_id = ? LIMIT 1`,
        args: [qrSetId, organizationId],
      });
      if (existingSet.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'QR code set not found' }, { status: 404 });
      }
    } else {
      const qrSetResult = await db.execute({
        sql: `SELECT id FROM qr_code_sets WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`,
        args: [organizationId],
      });

      if (qrSetResult.rows.length === 0) {
      // Create new QR code set
      qrSetId = uuidv4();
      await db.execute({
        sql: `INSERT INTO qr_code_sets (
                id, organization_id, name, language, form_fields, qr_codes,
                is_active, scan_count, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          qrSetId,
          organizationId,
          'Registration QR Codes',
          'en',
          JSON.stringify([]),
          JSON.stringify([]),
          1,
          0,
          now,
          now,
        ],
      });
      } else {
        qrSetId = (qrSetResult.rows[0] as any).id;
      }
    }

    // Generate QR codes for each entry point
    const qrCodes = [];
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:7777');

    for (const entryPoint of entryPoints) {
      const qrCodeId = uuidv4();
      const registrationUrl = `${baseUrl}/register/${orgSlug}/${entryPoint.slug}`;

      // Generate QR code image
      const qrDataUrl = await QRCode.toDataURL(registrationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: {
          dark: '#667eea',
          light: '#ffffff',
        },
      });

      qrCodes.push({
        id: qrCodeId,
        // IMPORTANT: Registration routes use the URL segment as `qrLabel`.
        // Our form-config lookup matches `label === qrLabel`, so label must be the slug.
        label: entryPoint.slug,
        slug: entryPoint.slug,
        url: registrationUrl,
        dataUrl: qrDataUrl,
        description: entryPoint.label,
      });
    }

    // Update QR code set with generated codes
    await db.execute({
      sql: `UPDATE qr_code_sets 
            SET qr_codes = ?, updated_at = ?
            WHERE id = ?`,
      args: [JSON.stringify(qrCodes), now, qrSetId],
    });

    return NextResponse.json({
      success: true,
      message: 'QR codes generated successfully',
      qrCodes,
      qrSetId,
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
