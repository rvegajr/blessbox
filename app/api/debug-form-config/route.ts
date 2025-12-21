import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient();
    
    // Step 1: Find organization
    console.log('Step 1: Looking for organization with slug: hopefoodbank');
    const orgResult = await db.execute({
      sql: `
        SELECT id, name, custom_domain 
        FROM organizations 
        WHERE custom_domain = ? OR LOWER(REPLACE(name, ' ', '-')) = ?
      `,
      args: ['hopefoodbank', 'hopefoodbank']
    });
    
    console.log('Organization result:', orgResult.rows);
    
    if (orgResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        step: 1,
        error: 'Organization not found',
        orgResult: orgResult.rows
      });
    }
    
    const org = orgResult.rows[0];
    console.log('Found organization:', org);
    
    // Step 2: Find QR code set
    console.log('Step 2: Looking for QR code set for organization:', org.id);
    const qrSetResult = await db.execute({
      sql: `
        SELECT id, organization_id, name, language, form_fields, qr_codes, is_active
        FROM qr_code_sets 
        WHERE organization_id = ? AND is_active = 1
      `,
      args: [org.id]
    });
    
    console.log('QR code set result:', qrSetResult.rows);
    
    if (qrSetResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        step: 2,
        error: 'QR code set not found',
        qrSetResult: qrSetResult.rows
      });
    }
    
    const qrSet = qrSetResult.rows[0];
    console.log('Found QR code set:', qrSet);
    
    // Step 3: Parse QR codes and find matching one
    console.log('Step 3: Parsing QR codes and looking for main-entrance');
    const qrCodes = JSON.parse(qrSet.qr_codes as string || '[]');
    console.log('QR codes:', qrCodes);
    
    const matchingQR = qrCodes.find((qr: any) => qr.label === 'main-entrance');
    console.log('Matching QR code:', matchingQR);
    
    if (!matchingQR) {
      return NextResponse.json({ 
        success: false, 
        step: 3,
        error: 'QR code not found',
        qrCodes: qrCodes
      });
    }
    
    // Step 4: Build form config
    const formConfig = {
      id: qrSet.id,
      organizationId: qrSet.organization_id,
      name: qrSet.name,
      language: qrSet.language,
      formFields: JSON.parse(qrSet.form_fields as string || '[]'),
      qrCodes: qrCodes
    };
    
    return NextResponse.json({ 
      success: true, 
      formConfig,
      debug: {
        org,
        qrSet,
        qrCodes,
        matchingQR
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
