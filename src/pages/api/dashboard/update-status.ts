import type { APIRoute } from 'astro';
import { RegistrationService } from '../../../implementations/dashboard/RegistrationService';

/**
 * Update Registration Status API Endpoint
 * 
 * Handles status updates for registrations (delivered, pending, failed)
 * Uses our beautiful RegistrationService with real database! 🎉
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { registrationId, status } = body;

    // Validate input
    if (!registrationId || typeof registrationId !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration ID is required and must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!status || !['pending', 'delivered', 'failed'].includes(status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Status must be one of: pending, delivered, failed',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update the registration status using our amazing service! 🚀
    const registrationService = new RegistrationService();
    const updatedRegistration = await registrationService.updateDeliveryStatus(
      registrationId,
      status as 'pending' | 'delivered' | 'failed'
    );

    if (!updatedRegistration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration not found or could not be updated',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Updated registration ${registrationId} status to: ${status}`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Registration status updated to ${status}`,
        registration: {
          id: updatedRegistration.id,
          deliveryStatus: updatedRegistration.deliveryStatus,
          deliveredAt: updatedRegistration.deliveredAt,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error updating registration status:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error while updating registration status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};