import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

  if (!applicationId || !locationId) {
    return NextResponse.json(
      { error: true, message: 'Square Application ID or Location ID is not configured.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    applicationId,
    locationId,
    environment,
  });
}
