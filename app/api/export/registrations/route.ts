import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { getOrganizationByEmail } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';

const registrationService = new RegistrationService();

// POST /api/export/registrations - Export registrations as CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { format = 'csv', filters } = body;

    // Get registrations with filters
    const registrations = await registrationService.listRegistrations(
      organization.id,
      filters
    );

    if (format === 'csv') {
      // Generate CSV
      if (registrations.length === 0) {
        return new NextResponse('No registrations to export', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`
          }
        });
      }

      // Parse first registration to get field names
      const firstReg = registrations[0];
      const firstFormData = JSON.parse(firstReg.registrationData);
      
      // Build CSV header
      const standardFields = ['Registration ID', 'QR Code ID', 'Registered At', 'Status', 'Checked In', 'Checked In At'];
      const dynamicFields = Object.keys(firstFormData).map(key => {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        return label;
      });
      const headers = [...standardFields, ...dynamicFields];

      // Build CSV rows
      const rows = registrations.map(reg => {
        const formData = JSON.parse(reg.registrationData);
        const standardValues = [
          reg.id,
          reg.qrCodeId,
          new Date(reg.registeredAt).toLocaleString(),
          reg.deliveryStatus,
          reg.checkedInAt ? 'Yes' : 'No',
          reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : ''
        ];
        const dynamicValues = Object.keys(firstFormData).map(key => {
          const value = formData[key];
          // Escape CSV values (handle commas, quotes, newlines)
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        return [...standardValues, ...dynamicValues];
      });

      // Combine into CSV
      const csvLines = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ];
      const csv = csvLines.join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported format. Use "csv"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








