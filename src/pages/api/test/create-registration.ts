import type { APIRoute } from 'astro';
import { createDatabaseConnection, getDatabase } from '../../../database/connection';
import { ensureLibsqlSchema } from '../../../database/bootstrap';
import { registrations } from '../../../database/schema';

export const POST: APIRoute = async ({ request }) => {
  try {
    await createDatabaseConnection();
    
    // Ensure database schema exists
    await ensureLibsqlSchema({});
    
    const db = getDatabase();

    const body = await request.json();
    const { qrCodeSetId, qrCodeId, registrationData } = body;

    if (!qrCodeSetId || !qrCodeId || !registrationData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'qrCodeSetId, qrCodeId, and registrationData are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create registration
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(registrations).values({
      id,
      qrCodeSetId,
      qrCodeId,
      registrationData: JSON.stringify(registrationData),
      ipAddress: '127.0.0.1',
      userAgent: 'E2E-Test-User-Agent',
      deliveryStatus: 'pending',
      registeredAt: now,
    });

    return new Response(
      JSON.stringify({
        success: true,
        registrationId: id,
        message: 'Registration created successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create registration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};