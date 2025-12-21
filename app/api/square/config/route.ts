import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const applicationId = (process.env.SQUARE_APPLICATION_ID || '').trim();
  const locationId = (process.env.SQUARE_LOCATION_ID || '').trim();
  const environment = (process.env.SQUARE_ENVIRONMENT || 'sandbox').trim();

  if (!applicationId || !locationId) {
    // IMPORTANT: Missing payment configuration is not a server error.
    // Return a non-5xx response so health checks / inventory tests don't fail.
    return NextResponse.json({
      enabled: false,
      environment,
      message: 'Square is not configured.',
      missing: {
        applicationId: !applicationId,
        locationId: !locationId,
      },
    });
  }

  return NextResponse.json({
    enabled: true,
    applicationId,
    locationId,
    environment,
  });
}
