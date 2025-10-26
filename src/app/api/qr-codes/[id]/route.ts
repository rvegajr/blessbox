/**
 * QR Code Detail API Routes
 * 
 * TDD Implementation: Created to make tests pass
 * ISP Compliance: Uses existing IQRCodeService interface
 * 
 * Endpoints:
 * - GET /api/qr-codes/[id] - Get QR code set by ID
 * - PUT /api/qr-codes/[id] - Update QR code set
 * - DELETE /api/qr-codes/[id] - Delete QR code set
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { QRCodeService } from '@/services/QRCodeService'
import { z } from 'zod'

// Validation schemas
const QRCodeSetUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  language: z.string().min(2, 'Language must be at least 2 characters').max(10, 'Language too long'),
  formFields: z.array(z.any()).default([]),
  qrCodes: z.array(z.any()).default([]),
  isActive: z.boolean().optional()
})

/**
 * GET /api/qr-codes/[id]
 * 
 * Get QR code set by ID
 * - Requires authentication
 * - Returns QR code set data
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
        { error: 'QR code set ID is required' },
        { status: 400 }
      )
    }

    // Get QR code set using service
    const qrCodeService = new QRCodeService()
    const result = await qrCodeService.getQRCodeSet(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'QR code set not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error getting QR code set:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/qr-codes/[id]
 * 
 * Update QR code set
 * - Requires authentication
 * - Validates input data
 * - Updates QR code set
 * - 404 if not found
 * - 400 if validation fails
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
        { error: 'QR code set ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = QRCodeSetUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Update QR code set using service
    const qrCodeService = new QRCodeService()
    const result = await qrCodeService.updateQRCodeSet(id, validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update QR code set' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating QR code set:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/qr-codes/[id]
 * 
 * Delete QR code set (soft delete)
 * - Requires authentication
 * - Prevents deletion if QR codes have registrations
 * - 404 if not found
 * - 400 if cannot delete (has registrations)
 */
export async function DELETE(
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
        { error: 'QR code set ID is required' },
        { status: 400 }
      )
    }

    // Delete QR code set using service
    const qrCodeService = new QRCodeService()
    const result = await qrCodeService.deleteQRCodeSet(id)

    if (!result.success) {
      // Check if it's a business logic error (has registrations)
      if (result.error?.includes('registrations')) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      
      // Otherwise, it's not found
      return NextResponse.json(
        { error: result.error || 'QR code set not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'QR code set deleted successfully' })
  } catch (error) {
    console.error('Error deleting QR code set:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
