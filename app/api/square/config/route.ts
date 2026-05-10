import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/utils/env';

export async function GET(req: NextRequest) {
  const applicationId = getEnv('SQUARE_APPLICATION_ID');
  const locationId = getEnv('SQUARE_LOCATION_ID');
  const environment = getEnv('SQUARE_ENVIRONMENT', 'sandbox');

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
