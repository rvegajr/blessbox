import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient, nowIso } from '@/lib/db';
import { createSubscription } from '@/lib/subscriptions';
import { CouponService } from '@/lib/coupons';
import { ClassService } from '@/lib/services/ClassService';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * POST /api/test/seed-prod
 *
 * Production-safe seeding endpoint for deterministic QA data.
 * - In production: requires header `x-test-seed-secret` matching env `PROD_TEST_SEED_SECRET`
 * - In non-production: allowed without secret (useful for local/dev recovery)
 *
 * Creates:
 * - organization (deterministic based on seedKey)
 * - qr_code_set (with form_fields + qr_codes)
 * - test coupons (QA guide codes)
 * - optional subscription, class, session, participant, enrollment
 *
 * Body:
 *   - seedKey: string (required, e.g., 'qa-prod-2024')
 *   - organizationName?: string (optional)
 *   - contactEmail?: string (optional)
 *   - seedSubscription?: boolean (default: true)
 *   - seedClasses?: boolean (default: true)
 *   - formFields?: array (optional)
 *   - entryPoints?: array (optional)
 *
 * Returns:
 *   - success: boolean
 *   - organizationId: string
 *   - orgSlug: string
 *   - contactEmail: string
 *   - qrCodeSetId: string
 *   - subscriptionId?: string
 *   - classId?: string
 *   - sessionId?: string
 *   - participantId?: string
 *   - enrollmentId?: string
 */
export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = (process.env.PROD_TEST_SEED_SECRET || '').trim();
  const provided = (req.headers.get('x-test-seed-secret') || '').trim();

  if (isProd) {
    if (!secret || !provided || provided !== secret) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    await ensureDbReady();
    const db = getDbClient();
    const now = nowIso();
    const couponService = new CouponService();
    const classService = new ClassService();

    const body = await req.json().catch(() => ({}));
    const seedKey: string = typeof body.seedKey === 'string' && body.seedKey ? body.seedKey.trim() : 'qa-prod-default';

    if (!seedKey) {
      return NextResponse.json({ success: false, error: 'seedKey is required' }, { status: 400 });
    }

    const orgName: string =
      typeof body.organizationName === 'string' && body.organizationName
        ? body.organizationName.trim()
        : `QA Production Org (${seedKey})`;
    const contactEmail: string =
      typeof body.contactEmail === 'string' && body.contactEmail
        ? body.contactEmail.trim()
        : `qa-prod-${seedKey}@blessbox.app`;

    const orgSlug = slugify(body.orgSlug || orgName) || `qa-prod-${seedKey}`;
    const orgId = uuidv4();

    // Check if organization already exists (by slug/custom_domain) - update if exists.
    // NOTE: contact_email is not unique (multi-org per email), so we MUST NOT de-dupe by email.
    const existingOrg = await db
      .execute({
        sql: `SELECT id, name, contact_email FROM organizations WHERE custom_domain = ? LIMIT 1`,
        args: [orgSlug],
      })
      .then((r) => r.rows[0] as any)
      .catch(() => null);

    let finalOrgId = orgId;
    if (existingOrg) {
      finalOrgId = existingOrg.id;
      // Update existing org
      await db.execute({
        sql: `UPDATE organizations SET 
                name = ?, event_name = ?, custom_domain = ?, contact_email = ?,
                contact_phone = ?, contact_address = ?, contact_city = ?,
                contact_state = ?, contact_zip = ?, email_verified = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          orgName,
          body.eventName || 'QA Production Event',
          orgSlug,
          contactEmail,
          body.contactPhone || '555-1234',
          body.contactAddress || '123 Test St',
          body.contactCity || 'Test City',
          body.contactState || 'TS',
          body.contactZip || '12345',
          1,
          now,
          finalOrgId,
        ],
      });
    } else {
      // Create new organization
      await db.execute({
        sql: `INSERT INTO organizations (
                id, name, event_name, custom_domain, contact_email, contact_phone,
                contact_address, contact_city, contact_state, contact_zip,
                email_verified, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          finalOrgId,
          orgName,
          body.eventName || 'QA Production Event',
          orgSlug,
          contactEmail,
          body.contactPhone || '555-1234',
          body.contactAddress || '123 Test St',
          body.contactCity || 'Test City',
          body.contactState || 'TS',
          body.contactZip || '12345',
          1,
          now,
          now,
        ],
      });
    }

    // Ensure test coupons exist (used by QA guide + checkout tests)
    await couponService.ensureSchema();
    const ensureCoupon = async (spec: {
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      maxUses?: number | null;
      expiresAt?: string | null;
      applicablePlans?: string[] | null;
    }) => {
      try {
        await couponService.createCoupon({
          code: spec.code,
          discountType: spec.discountType,
          discountValue: spec.discountValue,
          currency: 'USD',
          maxUses: spec.maxUses ?? null,
          expiresAt: spec.expiresAt ?? null,
          applicablePlans: spec.applicablePlans ?? null,
          createdBy: 'seed-prod',
        } as any);
        return { code: spec.code, created: true };
      } catch {
        return { code: spec.code, created: false };
      }
    };

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await ensureCoupon({ code: 'FREE100', discountType: 'percentage', discountValue: 100, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'WELCOME50', discountType: 'percentage', discountValue: 50, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'SAVE20', discountType: 'fixed', discountValue: 2000, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'FIRST10', discountType: 'fixed', discountValue: 1000, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'EXPIRED', discountType: 'percentage', discountValue: 10, expiresAt: past, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'MAXEDOUT', discountType: 'percentage', discountValue: 10, maxUses: 1, applicablePlans: ['standard', 'enterprise'] });
    // Force MAXEDOUT to be exhausted
    await db
      .execute({
        sql: `UPDATE coupons SET current_uses = max_uses WHERE code = ? AND max_uses IS NOT NULL`,
        args: ['MAXEDOUT'],
      })
      .catch(() => {});

    // Optional: create an active subscription for the org
    const seedSubscription = body.seedSubscription !== false;
    let subscriptionId: string | null = null;
    if (seedSubscription) {
      try {
        const sub = await createSubscription({
          organizationId: finalOrgId,
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
        });
        subscriptionId = sub?.id ? String(sub.id) : null;
      } catch (error) {
        console.warn('Failed to create subscription:', error);
      }
    }

    // Create QR code set with form fields + qr codes
    const qrCodeSetId = uuidv4();
    const formFields =
      Array.isArray(body.formFields) && body.formFields.length > 0
        ? body.formFields
        : [
            { id: 'firstName', type: 'text', label: 'First Name', required: true, placeholder: 'Enter your first name' },
            { id: 'lastName', type: 'text', label: 'Last Name', required: true, placeholder: 'Enter your last name' },
            { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Enter your email' },
            { id: 'phone', type: 'phone', label: 'Phone', required: false, placeholder: 'Enter your phone' },
            { id: 'address', type: 'textarea', label: 'Address', required: false, placeholder: 'Enter your address' },
            { id: 'dateOfBirth', type: 'date', label: 'Date of Birth', required: false, placeholder: '' },
          ];

    const entryPoints =
      Array.isArray(body.entryPoints) && body.entryPoints.length > 0
        ? body.entryPoints
        : [
            { label: 'Main Entrance', slug: 'main-entrance' },
            { label: 'Side Door', slug: 'side-door' },
          ];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'https://blessbox.org';
    const qrCodes = entryPoints.map((ep: any) => ({
      id: `qr_${ep.slug}`,
      label: ep.slug,
      url: `${baseUrl}/register/${orgSlug}/${ep.slug}`,
      description: ep.label,
      language: 'en',
      scanCount: 0,
      dataUrl: ep.dataUrl,
    }));

    // Check if QR code set exists for this org
    const existingQrSet = await db
      .execute({
        sql: `SELECT id FROM qr_code_sets WHERE organization_id = ? LIMIT 1`,
        args: [finalOrgId],
      })
      .then((r) => r.rows[0] as any)
      .catch(() => null);

    let finalQrCodeSetId = qrCodeSetId;
    if (existingQrSet) {
      finalQrCodeSetId = existingQrSet.id;
      // Update existing QR code set
      await db.execute({
        sql: `UPDATE qr_code_sets SET 
                name = ?, language = ?, form_fields = ?, qr_codes = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          body.qrSetName || 'QA Production Registration QR Codes',
          'en',
          JSON.stringify(formFields),
          JSON.stringify(qrCodes),
          now,
          finalQrCodeSetId,
        ],
      });
    } else {
      // Create new QR code set
      await db.execute({
        sql: `INSERT INTO qr_code_sets (
                id, organization_id, name, language, form_fields, qr_codes,
                is_active, scan_count, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          finalQrCodeSetId,
          finalOrgId,
          body.qrSetName || 'QA Production Registration QR Codes',
          'en',
          JSON.stringify(formFields),
          JSON.stringify(qrCodes),
          1,
          0,
          now,
          now,
        ],
      });
    }

    // Optional: seed a class, a session, a participant, and an enrollment
    let classId: string | null = null;
    let sessionId: string | null = null;
    let participantId: string | null = null;
    let enrollmentId: string | null = null;
    if (body.seedClasses !== false) {
      try {
        const cls = await classService.createClass({
          organization_id: finalOrgId,
          name: body.className || 'Yoga Basics',
          description: body.classDescription || 'Introduction to yoga for beginners',
          capacity: body.classCapacity || 20,
          timezone: body.classTimezone || 'UTC',
          status: 'active',
        });
        classId = cls.id;

        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const ses = await classService.createSession({
          class_id: cls.id,
          session_date: body.sessionDate || futureDate,
          session_time: body.sessionTime || '10:00',
          duration_minutes: body.sessionDuration || 60,
          location: body.sessionLocation || 'Main Studio',
          instructor_name: body.sessionInstructor || 'Jane Smith',
          status: 'scheduled',
        });
        sessionId = ses.id;

        const p = await classService.createParticipant({
          organization_id: finalOrgId,
          first_name: body.participantFirstName || 'Alice',
          last_name: body.participantLastName || 'Johnson',
          email: body.participantEmail || `alice-${seedKey}@blessbox.app`,
          phone: body.participantPhone || '(555) 111-2222',
          emergency_contact: '',
          emergency_phone: '',
          notes: '',
          status: 'active',
        });
        participantId = p.id;

        const enrollment = await classService.enrollParticipant({
          participant_id: p.id,
          class_id: cls.id,
          session_id: ses.id,
          enrollment_status: 'confirmed',
          enrolled_at: now,
          confirmed_at: now,
          notes: 'QA Production seed enrollment',
        });
        enrollmentId = enrollment.id;
      } catch (error) {
        console.warn('Failed to seed classes:', error);
      }
    }

    return NextResponse.json({
      success: true,
      organizationId: finalOrgId,
      orgSlug,
      contactEmail,
      qrCodeSetId: finalQrCodeSetId,
      qrCodes,
      subscriptionId,
      classId,
      sessionId,
      participantId,
      enrollmentId,
      note: isProd ? 'Seeded with production secret gate' : 'Seeded in non-production mode',
    });
  } catch (error) {
    console.error('seed-prod error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
