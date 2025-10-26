/**
 * Organization Detail API Routes
 * 
 * TDD Implementation: Created to make tests pass
 * ISP Compliance: Uses existing IOrganizationService interface
 * 
 * Endpoints:
 * - GET /api/organizations/[id] - Get organization by ID
 * - PUT /api/organizations/[id] - Update organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OrganizationService } from '@/services/OrganizationService'
import { z } from 'zod'

// Validation schemas
const OrganizationUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  eventName: z.string().min(1, 'Event name is required').max(100, 'Event name too long').optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  contactPhone: z.string().min(10, 'Phone number too short').max(20, 'Phone number too long').optional(),
  contactAddress: z.string().min(1, 'Address is required').max(200, 'Address too long').optional(),
  contactCity: z.string().min(1, 'City is required').max(50, 'City name too long').optional(),
  contactState: z.string().min(2, 'State must be at least 2 characters').max(10, 'State too long').optional(),
  contactZip: z.string().min(5, 'ZIP code too short').max(10, 'ZIP code too long').optional(),
  billingStatus: z.enum(['active', 'inactive', 'suspended', 'cancelled']).optional(),
  monthlyPrice: z.number().min(0, 'Price cannot be negative').max(999.99, 'Price too high').optional()
})

/**
 * GET /api/organizations/[id]
 * 
 * Get organization by ID
 * - Requires authentication
 * - Returns organization data
 * - 404 if not found
 * - 401 if not authenticated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get and validate ID parameter
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get organization using service
    const organizationService = new OrganizationService()
    const result = await organizationService.getOrganization(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error getting organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organizations/[id]
 * 
 * Update organization
 * - Requires authentication
 * - Validates input data
 * - Updates organization
 * - 404 if not found
 * - 400 if validation fails
 * - 403 if insufficient permissions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get and validate ID parameter
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = OrganizationUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Update organization using service
    const organizationService = new OrganizationService()
    const result = await organizationService.updateOrganization(id, validationResult.data)

    if (!result.success) {
      // Check if it's a permissions error
      if (result.error?.includes('permissions') || result.error?.includes('access')) {
        return NextResponse.json(
          { error: result.error },
          { status: 403 }
        )
      }
      
      // Otherwise, it's not found
      return NextResponse.json(
        { error: result.error || 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
