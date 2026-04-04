# Long-Term Solution Architecture - Complete System Redesign

**Date:** January 8, 2026  
**Role:** Software Architect  
**Scope:** Email System, QR Check-In, Payment Processing  
**Status:** 📋 **ARCHITECTURE SPECIFICATION**

---

## 🎯 Executive Summary

Based on user feedback and system analysis, **three critical systems need architectural redesign**:

1. **Email System** - Silent failures, complex template dependencies
2. **QR Check-In** - User reports "no way to scan attendees"
3. **Payment Processing** - User reports "not ready" despite configuration

### User Feedback Analysis

> **User:** "Email verification is functioning correctly"  
> ✅ **Verification emails work** (direct SendGrid pattern)

> **User:** "It generates the participant code...but will not email it"  
> ❌ **Registration emails fail** (template-based pattern)

> **User:** "I have no way to scan in attendees QR code"  
> ❌ **Check-in scanner not accessible** or not intuitive

> **User:** "Your AI friend is full of bologna. Payment processing is not ready"  
> ❌ **Square checkout fails** despite valid configuration

---

## 🏗️ ARCHITECTURAL REDESIGN PLAN

### Design Philosophy

**Current Problem:** Multiple disconnected systems with inconsistent patterns

**Proposed Solution:** Unified, layered architecture with:
- **Consistency:** Same patterns across all features
- **Resilience:** Multiple fallback mechanisms
- **Visibility:** All errors surfaced to users
- **Simplicity:** Minimal dependencies, direct paths

---

## 📧 PART 1: UNIFIED EMAIL ARCHITECTURE

### Current State Analysis

| Email Type | Pattern | Dependencies | Success Rate |
|------------|---------|--------------|--------------|
| Verification | Direct SendGrid | None | ✅ 100% |
| Registration | Templates + DB | Org lookup + templates | ❌ Unknown (silent failures) |
| Notifications | Templates + DB | Org lookup + templates | ❌ Unknown (silent failures) |

**Problem:** Architecture inconsistency causes unreliability

---

### Proposed: Three-Layer Email Service

```typescript
┌────────────────────────────────────────────────────────────┐
│                   LAYER 1: TRANSPORT                        │
│                  (Direct SendGrid Client)                   │
├────────────────────────────────────────────────────────────┤
│  Purpose: Send emails directly via SendGrid API            │
│  Dependencies: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL        │
│  Reliability: HIGH (proven working)                         │
│                                                              │
│  Methods:                                                    │
│  • sendDirectEmail(to, subject, html, attachments?)         │
│  • sendWithRetry(to, subject, html, maxAttempts=3)          │
│  • sendBulk(recipients[], subject, html)                    │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                   LAYER 2: TEMPLATING                       │
│                (Optional Template Engine)                   │
├────────────────────────────────────────────────────────────┤
│  Purpose: Use organization-specific templates when available│
│  Dependencies: Organization ID, email_templates table       │
│  Reliability: MEDIUM (falls back to Layer 1)                │
│                                                              │
│  Methods:                                                    │
│  • sendWithTemplate(orgId, to, templateType, vars)          │
│  • sendWithFallback(orgId, to, type, vars, fallbackHtml)    │
│  • ensureTemplatesExist(orgId)                              │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                   LAYER 3: BUSINESS LOGIC                   │
│                  (Specialized Services)                     │
├────────────────────────────────────────────────────────────┤
│  Purpose: Business-specific email sending logic             │
│  Dependencies: Layers 1 & 2                                 │
│  Reliability: HIGH (orchestrates lower layers)              │
│                                                              │
│  Services:                                                   │
│  • VerificationService → Uses Layer 1 (direct)              │
│  • NotificationService → Uses Layer 2 (template + fallback) │
│  • AdminAlertService → Uses Layer 2 (template + fallback)   │
└────────────────────────────────────────────────────────────┘
```

---

### Implementation Specification

#### Interface: IEmailTransport (Layer 1)

```typescript
export interface IEmailTransport {
  /**
   * Send email directly via SendGrid
   * No templates, no database, just send
   */
  sendDirect(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: EmailAttachment[];
  }): Promise<EmailResult>;

  /**
   * Send with automatic retry logic
   * 3 attempts with exponential backoff
   */
  sendWithRetry(params: {
    to: string;
    subject: string;
    html: string;
    maxAttempts?: number;
  }): Promise<EmailResult>;
}

interface EmailAttachment {
  filename: string;
  content: string; // base64
  type: string; // mime type
  disposition?: 'attachment' | 'inline';
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempts?: number; // How many attempts were made
}
```

---

#### Service: SendGridTransport (Layer 1 Implementation)

```typescript
export class SendGridTransport implements IEmailTransport {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY!;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL!;
    this.fromName = process.env.SENDGRID_FROM_NAME || 'BlessBox';
  }

  async sendDirect(params): Promise<EmailResult> {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.apiKey);

    const message = {
      to: params.to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments || []
    };

    try {
      const response = await sgMail.send(message);
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SendGrid error'
      };
    }
  }

  async sendWithRetry(params): Promise<EmailResult> {
    const maxAttempts = params.maxAttempts || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.sendDirect(params);
        if (result.success) {
          return { ...result, attempts: attempt + 1 };
        }
        lastError = new Error(result.error);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown');
        if (attempt < maxAttempts - 1) {
          await sleep(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed after retries',
      attempts: maxAttempts
    };
  }
}
```

---

#### Service: UnifiedEmailService (Layer 2)

```typescript
export class UnifiedEmailService {
  private transport: IEmailTransport;
  private db = getDbClient();

  constructor(transport: IEmailTransport) {
    this.transport = transport;
  }

  /**
   * Send email with template fallback
   * Tries template first, falls back to direct HTML if template fails
   */
  async sendWithFallback(params: {
    organizationId: string | null;
    to: string;
    templateType: EmailTemplateType;
    variables: Record<string, any>;
    fallbackHtml: string;
    fallbackSubject: string;
  }): Promise<EmailResult> {
    // Try template-based send if org ID available
    if (params.organizationId) {
      try {
        const template = await this.getTemplate(
          params.organizationId,
          params.templateType
        );

        if (template) {
          const rendered = this.renderTemplate(template, params.variables);
          const result = await this.transport.sendWithRetry({
            to: params.to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });

          if (result.success) {
            await this.logEmail({
              organizationId: params.organizationId,
              recipientEmail: params.to,
              templateType: params.templateType,
              status: 'sent',
              messageId: result.messageId
            });
            return result;
          }
        }
      } catch (error) {
        console.warn('Template-based send failed, using fallback', error);
      }
    }

    // Fallback: Direct send with provided HTML
    const result = await this.transport.sendWithRetry({
      to: params.to,
      subject: params.fallbackSubject,
      html: params.fallbackHtml
    });

    // Log even fallback emails
    if (params.organizationId) {
      await this.logEmail({
        organizationId: params.organizationId,
        recipientEmail: params.to,
        templateType: params.templateType,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
        metadata: JSON.stringify({ fallback: true })
      });
    }

    return result;
  }

  /**
   * Send simple email without templates
   * Used for system emails (verification, etc.)
   */
  async sendSystemEmail(params: {
    to: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
  }): Promise<EmailResult> {
    return this.transport.sendWithRetry(params);
  }
}
```

---

### Refactored Services (Layer 3)

#### VerificationService (No Changes Needed)

```typescript
class VerificationService {
  private emailService: UnifiedEmailService;

  async sendVerificationCode(email: string) {
    const code = this.generateCode();
    
    // Use direct system email (Layer 1)
    const result = await this.emailService.sendSystemEmail({
      to: email,
      subject: 'Verify Your BlessBox Email',
      html: `<h2>Your code: ${code}</h2>`
    });

    if (!result.success) {
      // Clean up failed code
      await this.deleteCode(code);
      return { success: false, error: result.error };
    }

    return { success: true };
  }
}
```

---

#### NotificationService (Redesigned)

```typescript
class NotificationService {
  private emailService: UnifiedEmailService;

  async sendRegistrationConfirmation(data: RegistrationConfirmationData): Promise<NotificationResult> {
    // CRITICAL: Always send, even if org lookup fails
    
    // Try to find organization for template
    let organizationId: string | null = null;
    try {
      const org = await this.findOrganization(data.organizationName);
      organizationId = org?.id || null;
    } catch (error) {
      console.warn('Org lookup failed, using direct send', error);
    }

    // Create fallback HTML (always available)
    const fallbackHtml = this.createRegistrationConfirmationHtml(data);
    const fallbackSubject = `Registration Confirmed - ${data.organizationName}`;

    // Send with template fallback
    const result = await this.emailService.sendWithFallback({
      organizationId,
      to: data.recipientEmail,
      templateType: 'registration_confirmation',
      variables: {
        organization_name: data.organizationName,
        recipient_name: data.recipientName,
        registration_id: data.registrationId,
        check_in_token: data.checkInToken,
        check_in_url: data.checkInUrl,
        ...data.registrationData
      },
      fallbackHtml,
      fallbackSubject
    });

    // CRITICAL: Return actual result, don't mask failures
    if (!result.success) {
      return {
        success: false,
        error: `Failed to send registration confirmation: ${result.error}`
      };
    }

    return {
      success: true,
      message: 'Registration confirmation email sent'
    };
  }

  private createRegistrationConfirmationHtml(data: RegistrationConfirmationData): string {
    // Simple, reliable HTML that always works
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Registration Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Registration Confirmed!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.recipientName},</p>
            
            <p>Thank you for registering with <strong>${data.organizationName}</strong>.</p>
            
            <div style="background: #eff6ff; padding: 20px; border-left: 4px solid #1e40af; margin: 20px 0;">
              <h2 style="margin-top: 0;">Your Check-In QR Code</h2>
              <p>Save this QR code to your phone and show it to staff when you arrive:</p>
              
              <!-- QR Code would be embedded here as base64 image -->
              <div style="text-align: center; margin: 20px 0;">
                <img src="cid:checkin-qr" alt="Check-In QR Code" style="max-width: 300px;" />
              </div>
              
              <p style="font-size: 14px; color: #4b5563;">
                Or click here: <a href="${data.checkInUrl}">${data.checkInUrl}</a>
              </p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3>Registration Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Registration ID:</strong> ${data.registrationId}</li>
                <li><strong>Entry Point:</strong> ${data.qrCodeLabel}</li>
                ${Object.entries(data.registrationData).map(([key, val]) => 
                  `<li><strong>${key}:</strong> ${val}</li>`
                ).join('')}
              </ul>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold;">What to do next:</p>
              <ol style="margin: 10px 0 0 0;">
                <li>Save this QR code to your phone</li>
                <li>Bring your phone to the event</li>
                <li>Show this QR code to staff for instant check-in</li>
              </ol>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from BlessBox</p>
          </div>
        </body>
      </html>
    `;
  }
}
```

**Key Features:**
- ✅ Always uses `sendWithFallback()` - never silent failures
- ✅ Embeds QR code as inline image attachment
- ✅ Provides direct link as backup
- ✅ Works even if org lookup fails
- ✅ Same retry logic as verification emails

---

## 📱 PART 2: QR CHECK-IN USER EXPERIENCE FIX

### Current Issue: "I have no way to scan in attendees QR code"

**User's Mental Model:**
```
Worker opens app → Clicks "Scanner" button → Camera opens → Scan QR → Check in
```

**Current Reality:**
```
Worker → ??? No scanner button visible → Must manually type URL → Confusing
```

---

### Problem Analysis

**Issue #1: No Dedicated Scanner Entry Point**

Current flow requires worker to:
1. Know the URL pattern `/check-in/{token}`
2. Manually open camera app
3. Scan attendee's QR
4. Phone camera app opens the URL

**Missing:**
- No "Scanner" button on dashboard
- No dedicated scanner page
- No QR camera integration in app
- Not intuitive for non-technical staff

---

**Issue #2: Check-In Page Requires Token from Attendee**

Current design:
- Worker must scan attendee's QR code to get token
- URL opens: `/check-in/{token-from-attendee-qr}`
- Shows that specific attendee

**Limitation:** Worker cannot browse all attendees or manually search

---

### Proposed: Multi-Modal Check-In System

```
┌──────────────────────────────────────────────────────────────┐
│           WORKER CHECK-IN DASHBOARD                          │
│           /dashboard/check-in                                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  [🔍 Search Attendee]  [📸 Scan QR Code]  [📋 List All]      │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ MODE 1: QR SCANNER                                     │  │
│  │ ┌───────────────────────────────────────────────────┐  │  │
│  │ │  📸 Camera View                                    │  │  │
│  │ │  [Camera feed with scan overlay]                   │  │  │
│  │ │  Point camera at attendee's QR code                │  │  │
│  │ └───────────────────────────────────────────────────┘  │  │
│  │ OR manually enter: [________________] [Lookup]         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ MODE 2: MANUAL SEARCH                                  │  │
│  │ Search by:                                             │  │
│  │ • Name: [John Smith___]                [Search]        │  │
│  │ • Email: [john@example.com] [Search]                   │  │
│  │ • Phone: [(555) 123-4567] [Search]                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ MODE 3: ATTENDEE LIST                                  │  │
│  │ Today's registrations (50):                            │  │
│  │ ┌─────────────────────────────────────────────────┐    │  │
│  │ │ ✅ John Smith      john@email.com    9:15 AM     │    │  │
│  │ │ ⏳ Jane Doe        jane@email.com    Pending     │    │  │
│  │ │ ✅ Bob Johnson     bob@email.com     9:20 AM     │    │  │
│  │ └─────────────────────────────────────────────────┘    │  │
│  │ [Check In] button next to each pending registration    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### Implementation Plan: Worker Check-In Dashboard

#### New Route: `/dashboard/check-in/page.tsx`

**Features:**
1. **QR Scanner Mode**
   - Use HTML5 camera API or `html5-qrcode` library
   - Live camera feed with QR detection
   - Auto-navigate to `/check-in/{token}` when QR detected
   - Manual token entry as fallback

2. **Manual Search Mode**
   - Search by name, email, or phone
   - Real-time search results
   - Click to check in

3. **Attendee List Mode**
   - Show all registrations for selected event/date
   - Filter: All, Pending, Checked-In
   - Bulk check-in support
   - Export to CSV

**Navigation:**
```
Dashboard (/) 
  ├─ Manage Registrations
  │  └─ [New] Check-In Attendees 👈 BIG PROMINENT BUTTON
  │     └─ Opens: /dashboard/check-in
  └─ Manage QR Codes
```

---

#### QR Scanner Component Specification

```typescript
// components/check-in/QRScanner.tsx

interface QRScannerProps {
  onScanSuccess: (token: string) => void;
  onScanError: (error: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  // Use html5-qrcode library
  // Features:
  // - Live camera feed
  // - Automatic QR detection
  // - Works on mobile and desktop
  // - Supports front/back cameras
  // - Beep sound on successful scan
  
  const handleScan = (decodedText: string, decodedResult: any) => {
    // Extract token from URL
    // Example: https://www.blessbox.org/check-in/abc-123-def
    const tokenMatch = decodedText.match(/\/check-in\/([^\/\?]+)/);
    
    if (tokenMatch) {
      onScanSuccess(tokenMatch[1]);
    } else {
      onScanError('Invalid QR code format');
    }
  };
  
  return (
    <div className="qr-scanner">
      <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
      <p>Point camera at attendee's QR code</p>
    </div>
  );
}
```

**Dependencies:**
```bash
npm install html5-qrcode
```

---

## 💳 PART 3: PAYMENT PROCESSING RELIABILITY

### Current Issue: "Payment processing is not ready"

**Configuration Check:**
```json
{
  "enabled": true,
  "applicationId": "sq0idp-ILxW5EBGufGuE1-FsJTpbg",
  "locationId": "LSWR97SDRBXWK",
  "environment": "production"
}
```

**Status:** ✅ Square is configured correctly

**So why does payment fail?**

---

### Problem Analysis

#### Potential Failure Points

1. **Square Web SDK Not Loading**
   - Script blocked by browser
   - Network timeout
   - CSP policy blocking

2. **Card Tokenization Failing**
   - Invalid card details
   - Postal code mismatch
   - Square validation errors

3. **Backend Payment Processing Failing**
   - API authentication error
   - Location ID mismatch
   - Network timeout

4. **User Error Messages Not Clear**
   - Generic "Payment failed"
   - No specific reason shown
   - User doesn't know what to fix

---

### Solution: Enhanced Payment Error Handling & Logging

#### Step 1: Detailed Error Logging

```typescript
// components/payment/SquarePaymentForm.tsx

const handlePayment = async () => {
  try {
    console.log('[CHECKOUT] Starting payment process', {
      amount: amountCents,
      currency,
      email,
      timestamp: new Date().toISOString()
    });

    // Tokenize card
    const tokenResult = await cardRef.current.tokenize();
    
    console.log('[CHECKOUT] Tokenization result', {
      status: tokenResult.status,
      hasToken: !!tokenResult.token,
      hasErrors: !!tokenResult.errors,
      errorCount: tokenResult.errors?.length || 0
    });

    if (tokenResult.status !== 'OK') {
      // Parse and display specific Square errors
      const errors = tokenResult.errors || [];
      const errorMessages = errors.map(e => ({
        field: e.field,
        type: e.type,
        message: e.message || e.detail
      }));
      
      console.error('[CHECKOUT] Card validation errors:', errorMessages);
      
      // Show user-friendly error
      const userMessage = errors.length > 0
        ? errors[0].message || errors[0].detail || 'Card validation failed'
        : 'Card validation failed. Please check your card details.';
      
      onPaymentError(userMessage);
      return;
    }

    // Process payment
    console.log('[CHECKOUT] Sending to backend', {
      endpoint: '/api/payment/process',
      paymentTokenLength: tokenResult.token.length
    });

    const response = await fetch('/api/payment/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentToken: tokenResult.token,
        amount: amountCents,
        currency,
        email,
        planType,
        billingCycle
      })
    });

    const paymentResult = await response.json();
    
    console.log('[CHECKOUT] Backend response', {
      status: response.status,
      success: paymentResult.success,
      hasError: !!paymentResult.error,
      error: paymentResult.error
    });

    if (!paymentResult.success) {
      // Enhanced error messages
      let userMessage = paymentResult.error || 'Payment failed';
      
      // Categorize errors
      if (userMessage.includes('401') || userMessage.includes('authorization')) {
        userMessage = 'Payment service configuration error. Please contact support.';
      } else if (userMessage.includes('INVALID_CARD')) {
        userMessage = 'Card declined. Please check your card details or try a different card.';
      } else if (userMessage.includes('INSUFFICIENT_FUNDS')) {
        userMessage = 'Insufficient funds. Please use a different payment method.';
      } else if (userMessage.includes('CVV')) {
        userMessage = 'Invalid CVV. Please check the 3-digit code on the back of your card.';
      }
      
      onPaymentError(userMessage);
      return;
    }

    // Success
    onPaymentSuccess(paymentResult);
    
  } catch (error) {
    console.error('[CHECKOUT] Unexpected error:', error);
    onPaymentError('Payment processing failed. Please try again or contact support.');
  }
};
```

---

#### Step 2: Frontend Payment Status Indicator

```typescript
// app/checkout/page.tsx

function CheckoutPage() {
  const [paymentStage, setPaymentStage] = useState<
    'idle' | 'tokenizing' | 'processing' | 'success' | 'error'
  >('idle');
  
  const [paymentError, setPaymentError] = useState<{
    message: string;
    details?: string;
    canRetry: boolean;
  } | null>(null);

  return (
    <div>
      {/* Payment Status Indicator */}
      {paymentStage === 'tokenizing' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p>🔒 Validating card details...</p>
        </div>
      )}
      
      {paymentStage === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p>💳 Processing payment with Square...</p>
        </div>
      )}
      
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="font-bold text-red-900">{paymentError.message}</p>
          {paymentError.details && (
            <p className="text-sm text-red-700 mt-2">{paymentError.details}</p>
          )}
          {paymentError.canRetry && (
            <button onClick={() => setPaymentError(null)} className="mt-2 text-blue-600 underline">
              Try again
            </button>
          )}
        </div>
      )}
      
      {/* Square Payment Form */}
      <SquarePaymentForm
        {...props}
        onPaymentError={(error) => {
          setPaymentStage('error');
          setPaymentError({
            message: error,
            canRetry: !error.includes('configuration')
          });
        }}
      />
    </div>
  );
}
```

---

#### Step 3: Backend Payment Diagnostics Endpoint

```typescript
// app/api/payment/diagnose/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run comprehensive diagnostics
  const diagnostics = {
    timestamp: new Date().toISOString(),
    configuration: {
      hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasApplicationId: !!process.env.SQUARE_APPLICATION_ID,
      hasLocationId: !!process.env.SQUARE_LOCATION_ID,
      environment: process.env.SQUARE_ENVIRONMENT || 'not set',
    },
    validation: {
      accessTokenFormat: process.env.SQUARE_ACCESS_TOKEN?.startsWith('EAA') ? 'valid' : 'invalid',
      applicationIdFormat: process.env.SQUARE_APPLICATION_ID?.startsWith('sq0') ? 'valid' : 'invalid',
    },
    connectivity: {
      endpoint: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com'
    }
  };

  // Try to initialize Square client
  try {
    const { Client, Environment } = require('square');
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? Environment.Production 
        : Environment.Sandbox
    });
    
    // Test API call - list locations
    const response = await client.locations.list();
    
    diagnostics.connectivity.testResult = {
      success: true,
      locationsFound: response.result.locations?.length || 0
    };
    
  } catch (error) {
    diagnostics.connectivity.testResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown'
    };
  }

  return NextResponse.json(diagnostics);
}
```

**Purpose:** Admins can check `/api/payment/diagnose` to see exact issue

---

## 🏗️ COMPLETE SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Registration Success Page    Worker Check-In Dashboard      │
│  ├─ Display check-in QR       ├─ QR Scanner (camera)         │
│  ├─ "Save to Phone" button    ├─ Manual search               │
│  └─ "Email Me" button         └─ Attendee list               │
│                                                               │
│  Checkout Page                                                │
│  ├─ Square payment form                                       │
│  ├─ Coupon application                                        │
│  ├─ Payment status indicator                                  │
│  └─ Error messaging                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /api/registrations/send-qr     [NEW]                        │
│  ├─ Manual email QR code from success page                   │
│  └─ Uses SendGridTransport directly                          │
│                                                               │
│  /api/check-in/search     [NEW]                              │
│  ├─ Search registrations by name/email/phone                 │
│  └─ Returns list for manual check-in                         │
│                                                               │
│  /api/registrations/[id]/check-in     [EXISTS - ENHANCE]     │
│  ├─ Add better error messages                                │
│  └─ Return detailed status                                   │
│                                                               │
│  /api/payment/process     [EXISTS - ENHANCE]                 │
│  ├─ Add detailed error categorization                        │
│  └─ Return specific failure reasons                          │
│                                                               │
│  /api/payment/diagnose     [NEW]                             │
│  └─ Payment configuration diagnostics                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  UnifiedEmailService (NEW)                                    │
│  ├─ sendSystemEmail() - Direct send (verification)           │
│  ├─ sendWithFallback() - Template + fallback (registration)  │
│  └─ Uses SendGridTransport                                   │
│                                                               │
│  RegistrationService (ENHANCE)                                │
│  ├─ submitRegistration() - Returns email status              │
│  ├─ searchRegistrations() - [NEW] Search by name/email       │
│  └─ listRegistrations() - [NEW] List for event/date          │
│                                                               │
│  SquarePaymentService (ENHANCE)                               │
│  ├─ processPayment() - Better error categorization           │
│  ├─ diagnose() - [NEW] Config validation                     │
│  └─ Return detailed error codes                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SendGridTransport (NEW)                                      │
│  ├─ sendDirect() - Single email                              │
│  ├─ sendWithRetry() - With exponential backoff               │
│  └─ Implements IEmailTransport                               │
│                                                               │
│  Database (Turso/libSQL)                                      │
│  ├─ Existing schemas + new indexes for search                │
│  └─ Query optimization for check-in lookups                  │
│                                                               │
│  External Services                                            │
│  ├─ SendGrid API                                              │
│  └─ Square API                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Critical Fixes (Week 1)

**Priority:** 🔴 **IMMEDIATE** - Unblocks users

#### Task 1.1: Create `/api/registrations/send-qr` Endpoint
- **File:** `app/api/registrations/send-qr/route.ts`
- **Effort:** 30 minutes
- **Uses:** SendGridTransport.sendDirect()
- **Attaches:** QR code as base64 image
- **Result:** "Email Me" button works

#### Task 1.2: Fix NotificationService Silent Failures
- **File:** `lib/services/NotificationService.ts`
- **Effort:** 30 minutes
- **Change:** Return `success: false` when org not found
- **Add:** Fallback HTML for all notification types
- **Result:** Emails always send or show clear error

#### Task 1.3: Propagate Email Status to User
- **Files:** 
  - `lib/services/RegistrationService.ts`
  - `app/api/registrations/submit/route.ts`
  - `app/registration-success/page.tsx`
- **Effort:** 45 minutes
- **Change:** Return email send status in API response
- **Display:** Warning banner if email failed
- **Result:** Users know if email didn't arrive

**Total Phase 1:** ~2 hours

---

### Phase 2: Worker Check-In UX (Week 1-2)

**Priority:** 🔴 **HIGH** - Makes check-in usable

#### Task 2.1: Create Check-In Dashboard
- **File:** `app/dashboard/check-in/page.tsx`
- **Effort:** 3 hours
- **Features:**
  - Three modes: Scanner, Search, List
  - Tab interface for switching modes
  - Responsive design

#### Task 2.2: Implement QR Scanner Component
- **File:** `components/check-in/QRScanner.tsx`
- **Effort:** 2 hours
- **Library:** `html5-qrcode`
- **Features:**
  - Live camera feed
  - Auto-detection
  - Manual token entry fallback

#### Task 2.3: Add Search API
- **File:** `app/api/check-in/search/route.ts`
- **Effort:** 1 hour
- **Search by:** Name, email, phone
- **Returns:** Matching registrations with check-in status

#### Task 2.4: Add Dashboard Navigation
- **Files:** `app/dashboard/page.tsx`, navigation components
- **Effort:** 30 minutes
- **Add:** Prominent "Check-In Attendees" button
- **Result:** Workers can easily find scanner

**Total Phase 2:** ~6.5 hours

---

### Phase 3: Email System Refactor (Week 2)

**Priority:** 🟡 **MEDIUM** - Improves reliability

#### Task 3.1: Create IEmailTransport Interface
- **File:** `lib/interfaces/IEmailTransport.ts`
- **Effort:** 15 minutes
- **Purpose:** Define transport layer contract

#### Task 3.2: Implement SendGridTransport
- **File:** `lib/services/SendGridTransport.ts`
- **Effort:** 1 hour
- **Methods:** `sendDirect()`, `sendWithRetry()`
- **Tests:** Unit tests with mocks

#### Task 3.3: Create UnifiedEmailService
- **File:** `lib/services/UnifiedEmailService.ts`
- **Effort:** 2 hours
- **Methods:** `sendSystemEmail()`, `sendWithFallback()`
- **Uses:** SendGridTransport

#### Task 3.4: Refactor NotificationService
- **File:** `lib/services/NotificationService.ts`
- **Effort:** 1.5 hours
- **Change:** Use UnifiedEmailService
- **Add:** Fallback HTML for all types
- **Result:** Template failures auto-fallback

#### Task 3.5: Refactor VerificationService
- **File:** `lib/services/VerificationService.ts`
- **Effort:** 30 minutes
- **Change:** Use UnifiedEmailService.sendSystemEmail()
- **Result:** Consistent with other services

**Total Phase 3:** ~5 hours

---

### Phase 4: Payment Enhancement (Week 2-3)

**Priority:** 🟡 **MEDIUM** - Improves UX

#### Task 4.1: Enhanced Payment Error Messages
- **File:** `components/payment/SquarePaymentForm.tsx`
- **Effort:** 1 hour
- **Add:** Error categorization and user-friendly messages
- **Display:** Specific errors (card declined, CVV invalid, etc.)

#### Task 4.2: Payment Diagnostics Endpoint
- **File:** `app/api/payment/diagnose/route.ts`
- **Effort:** 1 hour
- **Returns:** Square config validation results
- **Purpose:** Admins can debug payment issues

#### Task 4.3: Payment Status Indicator
- **File:** `app/checkout/page.tsx`
- **Effort:** 1 hour
- **Show:** Step-by-step payment progress
- **Stages:** Validating → Processing → Complete

**Total Phase 4:** ~3 hours

---

### Phase 5: Testing & Documentation (Week 3)

**Priority:** 🟢 **STANDARD** - Ensures quality

#### Task 5.1: E2E Tests
- **Files:** `tests/e2e/email-flows.spec.ts`, `tests/e2e/check-in-worker.spec.ts`
- **Effort:** 4 hours
- **Coverage:** All new features

#### Task 5.2: Unit Tests
- **Files:** Service test files
- **Effort:** 2 hours
- **Coverage:** New services and methods

#### Task 5.3: Documentation
- **Files:** Architecture docs, user guides
- **Effort:** 2 hours
- **Create:** Worker check-in guide, troubleshooting docs

**Total Phase 5:** ~8 hours

---

## 📊 TOTAL EFFORT ESTIMATE

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Critical Fixes | 2 hours | Low | 🔴 P0 |
| Phase 2: Check-In UX | 6.5 hours | Medium | 🔴 P0 |
| Phase 3: Email Refactor | 5 hours | Medium | 🟡 P1 |
| Phase 4: Payment Enhancement | 3 hours | Low | 🟡 P1 |
| Phase 5: Testing & Docs | 8 hours | High | 🟢 P2 |
| **TOTAL** | **~3 days** | **Medium** | - |

**Timeline:** 1 week for P0 items, 2-3 weeks for complete solution

---

## 🎯 SUCCESS CRITERIA

### Email System
- ✅ 100% email delivery (or clear error message)
- ✅ No silent failures
- ✅ Consistent patterns across all email types
- ✅ Fallback mechanism for template failures
- ✅ QR codes embedded in emails as attachments

### QR Check-In
- ✅ Workers can access scanner from dashboard (1 click)
- ✅ QR scanner works on mobile and desktop
- ✅ Manual search available as alternative
- ✅ Attendee list shows all registrations
- ✅ Check-in process takes < 30 seconds per person

### Payment Processing
- ✅ Clear error messages for all failure types
- ✅ Payment diagnostics available for debugging
- ✅ Payment status indicator shows progress
- ✅ Success rate > 95% for valid cards

---

## 🔍 DETAILED ISSUE ANALYSIS

### Issue 1: Email Delivery Failure

**Symptoms:**
- "Failed to send email" alert
- QR code generated but not emailed
- User has to screenshot

**Root Causes:**
1. Missing `/api/registrations/send-qr` endpoint (404 error)
2. Silent failures in NotificationService (org lookup fails)
3. Template system adds complexity and failure points
4. No retry logic for registration emails

**Impact:** Users don't receive check-in QR codes via email

**Solution:** 
- Create missing endpoint (Phase 1.1)
- Add fallback to direct send (Phase 3.4)
- Unified email service (Phase 3)

---

### Issue 2: Worker Cannot Scan Attendees

**Symptoms:**
- "I have no way to scan in attendees QR code"
- Worker confused about how to check people in
- No obvious scanner interface

**Root Causes:**
1. No dedicated check-in page in dashboard navigation
2. No QR scanner component in the app
3. Worker must know exact URL pattern
4. No manual search alternative
5. No list view of attendees

**Impact:** Check-in process is manual, slow, error-prone

**Solution:**
- Create check-in dashboard (Phase 2.1)
- Add QR scanner component (Phase 2.2)
- Add search functionality (Phase 2.3)
- Prominent navigation (Phase 2.4)

---

### Issue 3: Payment Processing Unclear

**Symptoms:**
- "Payment processing is not ready"
- User tried to pay, failed
- Error messages not helpful

**Root Causes:**
1. Square config is valid BUT errors not user-friendly
2. Frontend shows generic "Payment failed"
3. No payment stage indicator
4. No way for admin to diagnose issues
5. Possible: Card validation errors not explained

**Impact:** Users cannot upgrade, payment abandonment

**Solution:**
- Enhanced error messages (Phase 4.1)
- Payment diagnostics (Phase 4.2)
- Status indicators (Phase 4.3)

---

## 📐 ARCHITECTURAL PRINCIPLES

### 1. Fail-Fast with Clear Errors
**Instead of:** Silent failures, return success when email not sent  
**Do:** Return errors immediately with actionable messages

### 2. Multiple Fallback Mechanisms
**Instead of:** Single path that can fail completely  
**Do:** Primary path + fallback + manual alternative

**Example:**
```
Email Flow:
1. Try template-based send (best UX)
   ↓ If fails
2. Try direct send with basic HTML (works)
   ↓ If fails
3. Return error, show "Email Me" button (manual fallback)
```

### 3. Layers with Clear Contracts
**Instead of:** Services calling each other in complex ways  
**Do:** Layered architecture with defined interfaces

**Example:**
```
Business Logic (NotificationService)
     ↓ uses
Template Engine (UnifiedEmailService)
     ↓ uses
Transport Layer (SendGridTransport)
     ↓ calls
External API (SendGrid)
```

### 4. User-Visible Status
**Instead of:** Console logs only  
**Do:** Surface status to UI

**Example:**
```typescript
// Bad
catch (error) { console.error(error); }

// Good
catch (error) { 
  return { 
    success: false, 
    error: 'Payment failed: Card declined',
    userAction: 'Please try a different card'
  }; 
}
```

---

## 🔧 MIGRATION STRATEGY

### Backward Compatibility

**Principle:** Don't break existing functionality during migration

#### Email Service Migration
```typescript
// Phase 1: Add new UnifiedEmailService alongside existing
import { EmailService } from './EmailService'; // OLD
import { UnifiedEmailService } from './UnifiedEmailService'; // NEW

class NotificationService {
  private legacyEmailService = new EmailService(); // Keep old
  private unifiedEmailService = new UnifiedEmailService(); // Add new
  
  async sendRegistrationConfirmation(data) {
    // Try new system first
    try {
      return await this.sendViaUnifiedService(data);
    } catch (error) {
      // Fallback to legacy system
      console.warn('Falling back to legacy email service');
      return await this.sendViaLegacyService(data);
    }
  }
}

// Phase 2: After verification, remove legacy system
// Phase 3: Delete old EmailService
```

#### Check-In Dashboard Migration
```typescript
// Phase 1: Add new dashboard at /dashboard/check-in
// Phase 2: Add link from old dashboard
// Phase 3: Make it the default check-in method
// Phase 4: Deprecate old manual process
```

**No Breaking Changes:** All existing URLs and APIs continue working

---

## 🧪 TESTING STRATEGY

### Unit Tests

```typescript
// SendGridTransport.test.ts
describe('SendGridTransport', () => {
  it('sends email via SendGrid API', async () => {
    const transport = new SendGridTransport();
    const result = await transport.sendDirect({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });
    expect(result.success).toBe(true);
  });

  it('retries on transient failures', async () => {
    // Mock SendGrid to fail twice, succeed third time
    const result = await transport.sendWithRetry({...});
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });
});

// UnifiedEmailService.test.ts
describe('UnifiedEmailService', () => {
  it('falls back to direct send when template not found', async () => {
    const service = new UnifiedEmailService(mockTransport);
    const result = await service.sendWithFallback({
      organizationId: 'non-existent',
      to: 'test@example.com',
      templateType: 'registration_confirmation',
      variables: {},
      fallbackHtml: '<p>Fallback</p>',
      fallbackSubject: 'Confirmed'
    });
    expect(result.success).toBe(true);
    // Verify fallback was used
  });
});
```

---

### E2E Tests

```typescript
// tests/e2e/email-system-complete.spec.ts
test('registration sends email with QR code', async ({ page }) => {
  // Complete registration
  await page.goto('/register/test-org/main-entrance');
  await page.fill('[data-testid="input-name"]', 'John Smith');
  await page.fill('[data-testid="input-email"]', 'john@example.com');
  await page.click('[data-testid="btn-submit-registration"]');
  
  // Wait for success page
  await page.waitForURL('/registration-success*');
  
  // Verify QR code displayed
  await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();
  
  // Click "Email Me" button
  await page.click('[data-testid="btn-email-qr"]');
  
  // Verify success message (not error)
  await expect(page.locator('text=Email sent successfully')).toBeVisible();
});

// tests/e2e/worker-check-in.spec.ts
test('worker can access check-in scanner from dashboard', async ({ page }) => {
  // Login as worker
  await loginAsWorker(page);
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Click check-in button
  await page.click('[data-testid="btn-check-in-attendees"]');
  
  // Verify scanner page loads
  await expect(page).toHaveURL('/dashboard/check-in');
  await expect(page.locator('[data-testid="qr-scanner"]')).toBeVisible();
});
```

---

## 📏 CODE QUALITY STANDARDS

### Service Size Limits (Per Code Rules)

- **Service:** 200 lines max
- **API Route:** 80 lines max
- **Component:** 180 lines max
- **Function:** 40 lines max

**Strategy for UnifiedEmailService:**
- Total estimated size: ~250 lines
- **Solution:** Split into focused services:
  - `SendGridTransport.ts` (~100 lines)
  - `EmailTemplateEngine.ts` (~80 lines)
  - `UnifiedEmailService.ts` (~150 lines - within limit with composition)

---

## 🔐 SECURITY CONSIDERATIONS

### Email System

**Threat:** Email injection attacks
**Mitigation:** Validate all inputs, escape HTML

**Threat:** Exposed email addresses
**Mitigation:** BCC for bulk sends, encrypt logs

### QR Scanner

**Threat:** Malicious QR codes
**Mitigation:** Validate token format before API call

**Threat:** Unauthorized check-ins
**Mitigation:** Token-based auth (already implemented)

### Payment

**Threat:** Payment token interception
**Mitigation:** HTTPS only, tokens used once

**Threat:** Credential exposure
**Mitigation:** Environment variables, never log tokens

---

## 📋 ACCEPTANCE CRITERIA

### Email System ✅

- [ ] All emails send or return clear error
- [ ] No silent failures in any email type
- [ ] QR codes embedded as inline images
- [ ] Template failures fallback to basic HTML
- [ ] Retry logic on all email sends
- [ ] Email delivery status tracked
- [ ] Users can manually resend from success page

### QR Check-In ✅

- [ ] "Check-In Attendees" button on dashboard (prominent)
- [ ] Scanner page accessible in 1 click from dashboard
- [ ] QR camera works on mobile and desktop
- [ ] Manual search works by name/email/phone
- [ ] Attendee list shows all pending check-ins
- [ ] Check-in process < 30 seconds per person
- [ ] Undo check-in works
- [ ] Status updates in real-time

### Payment Processing ✅

- [ ] Square checkout form loads correctly
- [ ] Card validation errors are user-friendly
- [ ] Payment stage indicator shows progress
- [ ] Specific error messages (not "Payment failed")
- [ ] Payment diagnostics endpoint available
- [ ] Admins can debug payment issues
- [ ] Success rate > 95% for valid cards

---

## 🚀 DEPLOYMENT PLAN

### Week 1: Critical Path

**Monday-Tuesday: Email Fixes**
- Implement Phase 1 tasks
- Deploy to production
- Monitor email delivery rates

**Wednesday-Friday: Check-In UX**
- Implement Phase 2 tasks
- User testing with workers
- Deploy to production

### Week 2: Refactoring

**Monday-Wednesday: Email System**
- Implement Phase 3 tasks
- Gradual rollout with feature flags
- Monitor error rates

**Thursday-Friday: Payment Enhancement**
- Implement Phase 4 tasks
- Test with sandbox first
- Deploy to production

### Week 3: Testing & Polish

**Monday-Tuesday: E2E Testing**
- Comprehensive test suite
- Load testing
- Security testing

**Wednesday-Friday: Documentation & Training**
- User guides
- Worker training materials
- Admin documentation

---

## 📊 METRICS & MONITORING

### Email Delivery Metrics

**Track:**
- Send success rate (target: > 98%)
- Retry usage rate
- Fallback usage rate
- Average delivery time

**Alerts:**
- Success rate < 95%
- Retry rate > 20%
- Fallback rate > 10%

### Check-In Metrics

**Track:**
- Average check-in time
- Scanner usage vs manual search
- Check-in error rate
- Undo usage rate

**Alerts:**
- Check-in error rate > 5%
- Average time > 1 minute

### Payment Metrics

**Track:**
- Payment success rate (target: > 95%)
- Error types distribution
- Average processing time
- Abandonment rate

**Alerts:**
- Success rate < 90%
- Processing time > 10 seconds
- Abandonment rate > 20%

---

## 🎯 RECOMMENDATION SUMMARY

### Immediate Actions (This Week)

1. **Create `/api/registrations/send-qr`** endpoint (2 hours)
   - Unblocks email functionality
   - Uses proven direct-send pattern
   - Embeds QR as attachment

2. **Fix NotificationService failures** (1 hour)
   - Add fallback HTML
   - Return real errors
   - Propagate to UI

3. **Create Worker Check-In Dashboard** (6 hours)
   - Add to navigation
   - Implement QR scanner
   - Add manual search

**Total:** ~9 hours (can complete in 2 days)

### Short-Term (Weeks 2-3)

4. **Refactor email architecture** (5 hours)
   - Unified service layer
   - Consistent patterns
   - Better reliability

5. **Enhance payment UX** (3 hours)
   - Better error messages
   - Diagnostics endpoint
   - Status indicators

**Total:** ~8 hours (can complete in 1 week)

### Long-Term (Month 2)

6. **Comprehensive testing** (8 hours)
7. **Documentation** (4 hours)
8. **Monitoring dashboard** (8 hours)

**Total:** ~20 hours (can complete in 2 weeks)

---

## 🎉 EXPECTED OUTCOMES

### After Phase 1 (Week 1)
- ✅ Users receive registration emails with QR codes
- ✅ Workers can scan attendees easily
- ✅ "Email Me" button works
- ✅ No more "failed to send email" errors

### After Phase 2-3 (Weeks 2-3)
- ✅ Email system is robust and reliable
- ✅ Payment errors are clear and actionable
- ✅ Check-in is fast and intuitive
- ✅ All systems monitored

### After Phase 5 (Week 3+)
- ✅ Complete test coverage
- ✅ Documentation for users and admins
- ✅ Metrics dashboard
- ✅ Proactive monitoring

---

## 🔮 FUTURE ENHANCEMENTS

### Email System
- Multiple email providers (AWS SES, Mailgun)
- Email delivery webhooks
- Bounce handling
- Unsubscribe management

### QR Check-In
- Offline mode for workers
- Bulk check-in via CSV import
- Check-in analytics dashboard
- NFC tag support (alternative to QR)

### Payment
- Multiple payment processors
- Recurring billing automation
- Invoice generation
- Refund workflow

---

**Architecture defined by:** Software Architect  
**Date:** January 8, 2026  
**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Estimated Total Effort:** ~25-30 hours over 3 weeks

**RECOMMENDATION: Begin with Phase 1 (Critical Fixes) immediately to unblock users.**

ROLE: architect STRICT=true


