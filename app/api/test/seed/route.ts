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
 * Local-only seeding endpoint for Playwright and dev workflows.
 *
 * Creates:
 * - organization
 * - qr_code_set (with form_fields + qr_codes)
 * - optional sample registrations
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 404 });
  }

  try {
    await ensureDbReady();
    const db = getDbClient();
    const now = nowIso();
    const couponService = new CouponService();
    const classService = new ClassService();

    const body = await request.json().catch(() => ({}));
    const seedKey: string = typeof body.seedKey === 'string' && body.seedKey ? body.seedKey : 'local';
    const orgName: string =
      typeof body.organizationName === 'string' && body.organizationName ? body.organizationName : `E2E Seed Org (${seedKey})`;
    const contactEmail: string =
      typeof body.contactEmail === 'string' && body.contactEmail ? body.contactEmail : `seed-${seedKey}@example.com`;

    const orgSlug = slugify(body.orgSlug || orgName) || `org-${seedKey}`;
    const orgId = uuidv4();

    // Create organization
    await db.execute({
      sql: `INSERT INTO organizations (
              id, name, event_name, custom_domain, contact_email, contact_phone,
              contact_address, contact_city, contact_state, contact_zip,
              email_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orgId,
        orgName,
        body.eventName || 'Seed Event',
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
          createdBy: 'seed',
        } as any);
      } catch {
        // ignore duplicates
      }
    };

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await ensureCoupon({ code: 'FREE100', discountType: 'percentage', discountValue: 100, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'WELCOME50', discountType: 'percentage', discountValue: 50, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'SAVE20', discountType: 'fixed', discountValue: 2000, applicablePlans: ['standard', 'enterprise'] }); // cents
    await ensureCoupon({ code: 'FIRST10', discountType: 'fixed', discountValue: 1000, applicablePlans: ['standard', 'enterprise'] }); // cents
    await ensureCoupon({ code: 'EXPIRED', discountType: 'percentage', discountValue: 10, expiresAt: past, applicablePlans: ['standard', 'enterprise'] });
    await ensureCoupon({ code: 'MAXEDOUT', discountType: 'percentage', discountValue: 10, maxUses: 1, applicablePlans: ['standard', 'enterprise'] });
    // Force MAXEDOUT to be exhausted
    await db.execute({
      sql: `UPDATE coupons SET current_uses = max_uses WHERE code = ? AND max_uses IS NOT NULL`,
      args: ['MAXEDOUT'],
    }).catch(() => {});

    // Optional: create an active subscription for the org (so dashboard shows subscription details)
    const seedSubscription = body.seedSubscription !== false;
    let subscriptionId: string | null = null;
    if (seedSubscription) {
      const sub = await createSubscription({ organizationId: orgId, planType: 'standard', billingCycle: 'monthly', currency: 'USD' });
      subscriptionId = sub?.id ? String(sub.id) : null;
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7777';
    const qrCodes = entryPoints.map((ep: any) => ({
      id: `qr_${ep.slug}`,
      // NOTE: RegistrationService.getFormConfig matches QR codes by `label === qrLabel` (URL segment),
      // so `label` must be the slug.
      label: ep.slug,
      url: `${baseUrl}/register/${orgSlug}/${ep.slug}`,
      description: ep.label,
      language: 'en',
      scanCount: 0,
      // dataUrl optional; the app generates it in onboarding generate-qr
      dataUrl: ep.dataUrl,
    }));

    await db.execute({
      sql: `INSERT INTO qr_code_sets (
              id, organization_id, name, language, form_fields, qr_codes,
              is_active, scan_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        qrCodeSetId,
        orgId,
        body.qrSetName || 'Seed Registration QR Codes',
        'en',
        JSON.stringify(formFields),
        JSON.stringify(qrCodes),
        1,
        0,
        now,
        now,
      ],
    });

    // Optional: create sample registrations
    const registrationsCreated: string[] = [];
    const regInputs =
      Array.isArray(body.registrations) && body.registrations.length > 0
        ? body.registrations
        : [
            {
              qrCodeId: 'main-entrance',
              data: { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '(555) 987-6543' },
            },
          ];
    for (const r of regInputs) {
      const regId = uuidv4();
      await db.execute({
        sql: `INSERT INTO registrations (
                id, qr_code_set_id, qr_code_id, registration_data, ip_address, user_agent,
                delivery_status, registered_at, token_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          regId,
          qrCodeSetId,
          r.qrCodeId || 'main-entrance',
          JSON.stringify(r.data || {}),
          '127.0.0.1',
          'Seed-Agent',
          'pending',
          now,
          'active',
        ],
      });
      registrationsCreated.push(regId);
    }

    // Optional: seed a class, a session, a participant, and an enrollment (Part 8)
    let classId: string | null = null;
    let sessionId: string | null = null;
    let participantId: string | null = null;
    let enrollmentId: string | null = null;
    if (body.seedClasses !== false) {
      const cls = await classService.createClass({
        organization_id: orgId,
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
        organization_id: orgId,
        first_name: body.participantFirstName || 'Alice',
        last_name: body.participantLastName || 'Johnson',
        email: body.participantEmail || `alice-${seedKey}@example.com`,
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
        notes: 'Seed enrollment',
      });
      enrollmentId = enrollment.id;
    }

    return NextResponse.json({
      success: true,
      organizationId: orgId,
      orgSlug,
      contactEmail,
      qrCodeSetId,
      qrCodes,
      registrationsCreated,
      subscriptionId,
      classId,
      sessionId,
      participantId,
      enrollmentId,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

