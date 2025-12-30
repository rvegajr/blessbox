# BlessBox Implementation Checklist - Eliminate All Mock Implementations

## Overview
This checklist ensures all mock implementations are replaced with live services and proper API integrations.

> **Dec 2025 Status Update (Current Spec):** Production authentication is **NextAuth v5 6-digit code (email-only)** via `/login`. Any “verification code” references below are legacy/back-compat and may still exist only to support older tests or historical implementation notes.

## 1. Email Verification System ❌

### Current State:
- Mock implementation in `verify-email.astro` (accepts any 6-digit code)
- `EmailVerificationService` calls non-existent endpoints:
  - `/api/onboarding/send-verification`
  - `/api/onboarding/verify-code`
  - `/api/onboarding/check-verification`

### Required Implementation:
- [ ] Create `/api/onboarding/send-verification.ts` endpoint
- [ ] Create `/api/onboarding/verify-code.ts` endpoint
- [ ] Create `/api/onboarding/check-verification.ts` endpoint
- [ ] Implement verification code generation (6-digit random)
- [ ] Store verification codes with expiration (15 minutes)
- [ ] Rate limiting for verification requests
- [ ] Email template for verification codes
- [ ] Connect to existing email service (SendGrid/Gmail)

### Technical Requirements:
```typescript
// Verification code storage structure
interface VerificationCode {
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}
```

## 2. QR Code Service ❌

### Current State:
- Mock data in `QRCodeService.ts`:
  - `generateQRCodes()` returns fake base64 images
  - `getQRCodeSets()` returns hardcoded data
  - `getRegistrations()` returns mock registrations
  - `getAnalytics()` returns fake analytics

### Required Implementation:
- [ ] Integrate real QR code generation library (e.g., `qrcode`)
- [ ] Create database schema for QR code sets
- [ ] Implement QR code image generation with proper URLs
- [ ] Store QR code configurations in database
- [ ] Track real scan analytics
- [ ] Implement registration form endpoint

### Technical Requirements:
```typescript
// QR Code generation
import QRCode from 'qrcode';

// Generate actual QR code images
async generateQRCode(data: string): Promise<string> {
  return await QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
  });
}
```

## 3. Data Persistence ❌

### Current State:
- Using `sessionStorage` for all data
- No database integration
- Data lost on session end

### Required Implementation:
- [ ] Set up database (PostgreSQL/MongoDB)
- [ ] Create database schemas:
  - [ ] Organizations
  - [ ] Users
  - [ ] QR Code Sets
  - [ ] Registrations
  - [ ] Verification Codes
  - [ ] Form Configurations
- [ ] Implement data access layer
- [ ] Add database connection to API endpoints
- [ ] Migrate from sessionStorage to database

### Database Schema:
```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  event_name VARCHAR(255),
  custom_domain VARCHAR(255) UNIQUE,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE
);

-- Verification Codes
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

-- Form Fields
CREATE TABLE form_fields (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  field_type VARCHAR(50),
  label VARCHAR(255),
  required BOOLEAN DEFAULT FALSE,
  options TEXT[], -- For select fields
  order_index INTEGER
);

-- QR Code Sets
CREATE TABLE qr_code_sets (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- QR Codes
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY,
  qr_code_set_id UUID REFERENCES qr_code_sets(id),
  label VARCHAR(255),
  url VARCHAR(500),
  image_data TEXT, -- Base64 encoded
  created_at TIMESTAMP DEFAULT NOW()
);

-- Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY,
  qr_code_id UUID REFERENCES qr_codes(id),
  form_data JSONB,
  submitted_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  distributed BOOLEAN DEFAULT FALSE
);
```

## 4. Authentication & Authorization ❌

### Current State:
- No authentication system
- No user sessions
- No role-based access

### Required Implementation:
- [ ] Implement JWT-based authentication
- [ ] Create login/logout endpoints
- [ ] Add session management
- [ ] Implement role-based access control
- [ ] Secure API endpoints with authentication middleware
- [ ] Add organization-level permissions

## 5. API Endpoints ❌

### Missing Endpoints:
- [ ] `/api/onboarding/send-verification`
- [ ] `/api/onboarding/verify-code`
- [ ] `/api/onboarding/check-verification`
- [ ] `/api/onboarding/save-organization`
- [ ] `/api/onboarding/save-form-config`
- [ ] `/api/onboarding/save-qr-config`
- [ ] `/api/qr/generate`
- [ ] `/api/qr/download`
- [ ] `/api/registrations/submit`
- [ ] `/api/registrations/list`
- [ ] `/api/analytics/dashboard`

## 6. Form Language Support ❌

### Current State:
- Hardcoded language options
- No actual translation system

### Required Implementation:
- [ ] Implement i18n system for forms
- [ ] Create translation files for supported languages
- [ ] Add language switching functionality
- [ ] Store language preference per QR code

## 7. Domain Validation ❌

### Current State:
- Mock domain availability check
- No actual domain validation

### Required Implementation:
- [ ] Create domain availability API endpoint
- [ ] Implement subdomain creation system
- [ ] DNS configuration for custom domains
- [ ] SSL certificate generation

## 8. File Storage ❌

### Current State:
- QR codes stored as base64 in memory
- No persistent file storage

### Required Implementation:
- [ ] Set up cloud storage (AWS S3/Cloudinary)
- [ ] Implement file upload service
- [ ] Store QR code images in cloud
- [ ] Generate downloadable QR code packages

## 9. Analytics & Reporting ❌

### Current State:
- Mock analytics data
- No real tracking

### Required Implementation:
- [ ] Implement scan tracking
- [ ] Real-time analytics dashboard
- [ ] Export functionality for reports
- [ ] Registration trends analysis

## 10. Error Handling & Logging ❌

### Current State:
- Basic console.error statements
- No structured logging

### Required Implementation:
- [ ] Implement structured logging system
- [ ] Add error tracking (Sentry/Rollbar)
- [ ] Create error recovery mechanisms
- [ ] Add monitoring and alerting

## 11. Testing Infrastructure ❌

### Current State:
- Unit tests for interfaces only
- No integration tests
- No E2E tests

### Required Implementation:
- [ ] Add integration tests for API endpoints
- [ ] Implement E2E tests for critical flows
- [ ] Add test database setup
- [ ] CI/CD pipeline with test automation

## 12. Security Measures ❌

### Required Implementation:
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting on all endpoints
- [ ] API key management
- [ ] Encryption for sensitive data

## Implementation Priority

### Phase 1 - Core Infrastructure (Week 1)
1. Database setup and schemas
2. Authentication system
3. Email verification endpoints
4. Basic data persistence

### Phase 2 - Feature Implementation (Week 2)
1. QR code generation
2. Form builder persistence
3. Registration endpoints
4. Domain validation

### Phase 3 - Enhancement (Week 3)
1. Analytics implementation
2. File storage
3. Language support
4. Security hardening

### Phase 4 - Polish & Testing (Week 4)
1. Error handling
2. Logging system
3. Integration tests
4. Performance optimization

## Success Criteria
- [ ] Zero mock implementations in production code
- [ ] All data persisted to database
- [ ] Real emails sent for verification
- [ ] Actual QR codes generated and stored
- [ ] Secure authentication in place
- [ ] All API endpoints functional
- [ ] Comprehensive error handling
- [ ] 80%+ test coverage

## Notes
- Each implementation should follow TDD principles
- Maintain interface segregation (ISP)
- Use dependency injection for testability
- Document all API endpoints with OpenAPI/Swagger
- Implement graceful degradation for external services