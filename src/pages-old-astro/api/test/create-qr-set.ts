import type { APIRoute } from 'astro';
import { createDatabaseConnection, getDatabase } from '../../../database/connection';
import { ensureLibsqlSchema } from '../../../database/bootstrap';
import { qrCodeSets } from '../../../database/schema';

export const POST: APIRoute = async ({ request }) => {
  try {
    await createDatabaseConnection();
    
    // Ensure database schema exists
    await ensureLibsqlSchema({});
    
    const db = getDatabase();

    const body = await request.json();
    const { id, organizationId, name, formFields, qrCodes } = body;

    if (!id || !organizationId || !name || !formFields || !qrCodes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'id, organizationId, name, formFields, and qrCodes are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create QR code set
    const now = new Date().toISOString();

    await db.insert(qrCodeSets).values({
      id,
      organizationId,
      name,
      language: 'en',
      formFields: JSON.stringify(formFields),
      qrCodes: JSON.stringify(qrCodes),
      isActive: true,
      scanCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeSetId: id,
        message: 'QR code set created successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create QR code set error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create QR code set',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};