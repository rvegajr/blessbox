/**
 * POST /api/registrations/send-qr
 * 
 * Email check-in QR code to registrant
 * Called from registration success page "Email Me" button
 */

import { NextRequest, NextResponse } from 'next/server';
import { SendGridTransport } from '@/lib/services/SendGridTransport';
import { getDbClient } from '@/lib/db';

const emailTransport = new SendGridTransport();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, checkInToken, qrCodeDataUrl } = body;

    // Validate required fields
    if (!registrationId || !checkInToken) {
      return NextResponse.json(
        { success: false, error: 'Registration ID and check-in token are required' },
        { status: 400 }
      );
    }

    // Fetch registration details
    const db = getDbClient();
    const regResult = await db.execute({
      sql: `
        SELECT r.*, o.name as organization_name, o.event_name
        FROM registrations r
        LEFT JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        LEFT JOIN organizations o ON qcs.organization_id = o.id
        WHERE r.id = ?
      `,
      args: [registrationId]
    });

    if (regResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    const registration = regResult.rows[0] as any;
    const registrationData = JSON.parse(registration.registration_data || '{}');
    const recipientEmail = registrationData.email || registrationData.Email || registrationData.emailAddress;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address found in registration data' },
        { status: 400 }
      );
    }

    const recipientName = registrationData.name || registrationData.Name || registrationData.fullName || 'Valued Customer';
    const organizationName = registration.organization_name || 'BlessBox';
    const eventName = registration.event_name || '';

    // Generate check-in URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.PUBLIC_APP_URL || 'https://www.blessbox.org';
    const checkInUrl = `${baseUrl}/check-in/${checkInToken}`;

    // Create email HTML with embedded QR code
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Your Check-In QR Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: #1e40af; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Your Check-In QR Code</h1>
          </div>
          
          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello <strong>${recipientName}</strong>,</p>
            
            <p style="font-size: 16px; color: #374151;">
              You're all set for <strong>${organizationName}</strong>${eventName ? ` - ${eventName}` : ''}!
            </p>
            
            <div style="background: #eff6ff; padding: 30px; border-left: 4px solid #1e40af; margin: 30px 0; text-align: center;">
              <h2 style="margin-top: 0; color: #1e40af;">Show This QR Code at the Event</h2>
              
              <div style="background: white; padding: 20px; display: inline-block; border-radius: 8px; margin: 20px 0;">
                <img src="cid:checkin-qr" alt="Check-In QR Code" style="display: block; width: 300px; height: 300px;" />
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 10px 0;">
                Or use this link: <a href="${checkInUrl}" style="color: #1e40af;">${checkInUrl}</a>
              </p>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">📋 What to do:</p>
              <ol style="margin: 0; padding-left: 20px; color: #78350f;">
                <li>Save this email or screenshot the QR code above</li>
                <li>Bring your phone to the event</li>
                <li>Show this QR code to staff when you arrive</li>
                <li>Get checked in instantly!</li>
              </ol>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                <strong>Registration ID:</strong> ${registrationId.substring(0, 12)}...
              </p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                <strong>Registered:</strong> ${new Date(registration.registered_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">This is an automated message from BlessBox</p>
            <p style="margin: 5px 0;">Please do not reply to this email</p>
          </div>
        </body>
      </html>
    `;

    // Prepare QR code attachment
    const qrAttachment = qrCodeDataUrl ? {
      filename: 'checkin-qr.png',
      content: qrCodeDataUrl.split(',')[1], // Remove data:image/png;base64, prefix
      type: 'image/png',
      disposition: 'inline' as const,
      contentId: 'checkin-qr' // For <img src="cid:checkin-qr">
    } : undefined;

    // Send email with retry logic
    const result = await emailTransport.sendWithRetry({
      to: recipientEmail,
      subject: `Your Check-In QR Code - ${organizationName}`,
      html,
      text: `Your check-in QR code for ${organizationName}. View this email in HTML or visit: ${checkInUrl}`,
      ...(qrAttachment ? { attachments: [qrAttachment] } : {})
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to send email: ${result.error}` 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in QR code emailed successfully',
      messageId: result.messageId,
      attempts: result.attempts
    });

  } catch (error) {
    console.error('Send QR error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

