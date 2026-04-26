import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RegistrationService, RegistrationLimitError } from '@/lib/services/RegistrationService';
import { parseODataQuery } from '@/lib/utils/odataParser';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

const registrationService = new RegistrationService();

// formData is dynamic per organization's form-config — accept any string-keyed
// record. Required base fields are always present.
const RegistrationSubmitSchema = z.object({
  orgSlug: z.string().min(1).max(200),
  qrLabel: z.string().min(1).max(200),
  formData: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/registrations - Submit a new registration
export async function POST(request: NextRequest) {
  // Per-IP rate limit: 30/min — high enough for legit kiosk use, blocks scripted abuse
  const ipLimit = rateLimit(request, { key: 'registrations/submit:ip', limit: 30, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const parsed = await parseBody(request, RegistrationSubmitSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const { orgSlug, qrLabel, formData, metadata } = parsed.data;

    // Submit registration
    const registration = await registrationService.submitRegistration(
      orgSlug,
      qrLabel,
      formData as any,
      metadata as any
    );
    
    return NextResponse.json({ 
      success: true, 
      registration,
      message: 'Registration submitted successfully'
    });
  } catch (error) {
    console.error('Registration submission error:', error);
    
    // Handle registration limit exceeded
    if (error instanceof RegistrationLimitError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'limit_exceeded',
          message: error.message,
          currentCount: error.currentCount,
          limit: error.limit,
          upgradeUrl: error.upgradeUrl
        },
        { status: 403 }
      );
    }
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Form configuration not found')) {
        return NextResponse.json(
          { success: false, error: 'Registration form not found. Please check the QR code URL.' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Missing required field')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/registrations?organizationId=xxx&$filter=...&$orderby=... - List registrations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId query parameter is required' },
        { status: 400 }
      );
    }

    // Parse OData query parameters
    const odataQuery = parseODataQuery(searchParams);
    
    // Build filters from OData query
    const filters: any = {};
    
    if (odataQuery.filter) {
      // Parse filter conditions
      for (const condition of odataQuery.filter) {
        if (condition.field === 'deliveryStatus' && condition.operator === 'eq') {
          filters.deliveryStatus = condition.value;
        } else if (condition.field === 'qrCodeSetId' && condition.operator === 'eq') {
          filters.qrCodeSetId = condition.value;
        } else if (condition.field === 'qrCodeId' && condition.operator === 'eq') {
          filters.qrCodeId = condition.value;
        } else if (condition.field === 'registeredAt') {
          if (condition.operator === 'ge') {
            filters.startDate = condition.value;
          } else if (condition.operator === 'le') {
            filters.endDate = condition.value;
          }
        }
      }
    }

    // Get registrations
    const registrations = await registrationService.listRegistrations(organizationId, filters);
    
    // Apply OData ordering
    if (odataQuery.orderBy && odataQuery.orderBy.length > 0) {
      const orderBy = odataQuery.orderBy[0];
      registrations.sort((a, b) => {
        let aValue: any = a[orderBy.field as keyof typeof a];
        let bValue: any = b[orderBy.field as keyof typeof b];
        
        // Handle date fields
        if (orderBy.field === 'registeredAt' || orderBy.field === 'deliveredAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        if (orderBy.direction === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }
    
    // Apply OData pagination
    let result = registrations;
    if (odataQuery.top) {
      result = result.slice(0, odataQuery.top);
    }
    if (odataQuery.skip) {
      result = result.slice(odataQuery.skip);
    }
    
    // Build response
    const response: any = {
      success: true,
      data: result,
      count: result.length
    };
    
    if (odataQuery.count) {
      response.totalCount = registrations.length;
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('List registrations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
