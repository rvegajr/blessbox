import type { APIRoute } from 'astro';
import { createDatabaseConnection, getDatabase } from '../../../database/connection';
import { ensureLibsqlSchema } from '../../../database/bootstrap';
import { organizations } from '../../../database/schema';

export const POST: APIRoute = async ({ request }) => {
  try {
    await createDatabaseConnection();
    
    // Ensure database schema exists
    await ensureLibsqlSchema({});
    
    const db = getDatabase();

    const body = await request.json();
    const { id, name, eventName, contactEmail, emailVerified = true } = body;

    if (!id || !name || !contactEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'id, name, and contactEmail are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create organization
    const now = new Date().toISOString();

    await db.insert(organizations).values({
      id,
      name,
      eventName: eventName || '',
      contactEmail,
      emailVerified: emailVerified ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });

    return new Response(
      JSON.stringify({
        success: true,
        organizationId: id,
        message: 'Organization created successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create organization error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create organization',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};