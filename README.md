# BlessBox

> Streamlined QR-based registration and verification system for organizations managing events like food distributions, seminar registrations, and volunteer sign-ups.

[![Production](https://img.shields.io/badge/Production-Live-success)](https://www.blessbox.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)](https://tailwindcss.com/)

## Features

- **QR Code Registration** - Generate custom QR codes for different event types and entry points
- **Mobile-First Design** - Responsive forms optimized for scanning and registration on mobile devices
- **Real-time Verification** - Staff can verify registrations and process check-ins instantly
- **Coupon System** - Built-in discount codes and promotional offers (WELCOME25, SAVE10, NGO50, FIXED500)
- **Square Payment Integration** - Secure payment processing for subscription plans
- **Subscription Management** - Free, Standard, and Enterprise pricing tiers
- **Email Verification** - Passwordless authentication with verification codes
- **Multi-Entry Tracking** - Monitor different entry points (doors, lanes, checkpoints)
- **Export & Analytics** - Download registration data and view comprehensive analytics
- **Tutorial System** - Interactive walkthroughs for new users (13 tutorials available)

## Tech Stack

- **Framework:** Next.js 15.5 (App Router)
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS v4.1
- **Database:** Turso (LibSQL/SQLite)
- **ORM:** Drizzle ORM
- **Payments:** Square SDK
- **Email:** SendGrid / SMTP
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Deployment:** Vercel

## Quick Start

### 1. Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Turso account (for database)
- Square account (for payments)
- SendGrid account or SMTP server (for emails)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/blessbox.git
cd blessbox

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Email Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Or use SMTP (MailHog for local testing)
EMAIL_PROVIDER=smtp
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# Square Payments
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_ENVIRONMENT=sandbox  # or 'production'

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Application URL
PUBLIC_APP_URL=http://localhost:7777
```

See [env.template](env.template) for a complete list of environment variables.

### 4. Database Setup

```bash
# Generate database migrations
npm run db:generate

# Push schema to database
npm run db:migrate

# Optional: Setup test data
npm run db:setup
```

### 5. Development Server

```bash
# Start development server on port 7777
npm run dev

# Open http://localhost:7777 in your browser
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:7777 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run preview` | Preview production build locally |
| `npm test` | Run unit tests with Vitest |
| `npm run test:e2e:production` | Run E2E tests against production |
| `npm run test:coverage` | Generate test coverage report |
| `npm run db:migrate` | Push database schema changes |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run validate:env` | Validate environment variables |

## Project Structure

```
blessbox/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── register/          # Public registration forms
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── admin/            # Admin dashboard components
│   ├── dashboard/        # Dashboard UI components
│   ├── forms/            # Form components
│   └── ui/               # Reusable UI components
├── lib/                   # Shared utilities and services
│   ├── database/         # Database schema and connection
│   ├── services/         # Business logic services
│   └── utils/            # Helper functions
├── src/                   # Source files
│   ├── interfaces/       # TypeScript interfaces
│   ├── implementations/  # Service implementations
│   └── tests/            # Test files
├── public/               # Static assets
│   ├── tutorials/        # Tutorial system files
│   └── images/           # Images and icons
├── scripts/              # Build and utility scripts
├── tests/                # E2E tests
│   └── e2e/              # Playwright test suites
└── docs/                 # Documentation files
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login with password
- `POST /api/auth/request-code` - Request verification code
- `POST /api/auth/verify-code` - Verify email code
- `POST /api/auth/logout` - Logout user

### Onboarding
- `POST /api/onboarding/send-verification` - Send email verification
- `POST /api/onboarding/verify-code` - Verify email code
- `POST /api/onboarding/save-organization` - Create organization
- `POST /api/onboarding/save-form-config` - Save form configuration
- `POST /api/onboarding/generate-qr` - Generate QR codes

### Registration
- `GET /api/registrations` - List registrations
- `POST /api/registrations` - Create registration
- `GET /api/registrations/export` - Export registrations (PDF/CSV)
- `GET /api/register/form/[qrCodeId]` - Get registration form

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/analytics` - Get analytics data
- `GET /api/dashboard/recent-activity` - Get recent activity

### QR Codes
- `GET /api/qr-codes` - List QR codes
- `POST /api/qr-codes` - Create QR code
- `POST /api/qr/download` - Download QR codes as ZIP

### Payments
- `POST /api/payment/create-intent` - Create Square payment
- `POST /api/payment/process` - Process payment
- `POST /api/payment/validate-coupon` - Validate coupon code

### Coupons
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/admin/coupons` - List all coupons (admin)
- `POST /api/admin/coupons` - Create coupon (admin)
- `PUT /api/admin/coupons/[id]` - Update coupon (admin)

## Testing

### Unit Tests (Vitest)
```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Current Status:** 297/378 tests passing (78.6%)

### E2E Tests (Playwright)
```bash
# Run E2E tests against production
npm run test:e2e:production

# Run with browser visible
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:report
```

**Current Status:** 83/98 tests passing (84.7%)

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Set appropriate values for production environment

3. **Deploy**
   ```bash
   # Deploy to production
   git push origin main

   # Deploy preview
   git push origin feature-branch
   ```

### Manual Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

## Coupon Codes

BlessBox includes a built-in coupon system. Available coupons:

| Code | Discount | Description |
|------|----------|-------------|
| `WELCOME25` | 25% off | Welcome discount for new users |
| `SAVE10` | 10% off | Standard savings code |
| `NGO50` | 50% off | Non-profit organizations |
| `FIXED500` | $5.00 off | Fixed amount discount |

Manage coupons at `/admin/coupons` (admin access required).

## Tutorial System

The application includes 13 interactive tutorials:
- Welcome Tour
- Dashboard Tour
- QR Creation Tour
- Event Management Tour
- Team Management Tour
- Registration Management
- Check-In Tutorial
- Form Builder Tutorial
- QR Configuration Tutorial
- Analytics Tutorial
- Export Data Tutorial
- Onboarding Complete Flow
- Payment & Coupons Tutorial

Access tutorials via the help button or contextual triggers.

## Admin Access

**Development Credentials:**
- Email: `admin@blessbox.app`
- Password: `BlessBox2024!Admin`

> **Security Warning:** Change these credentials in production!

## Production URLs

- **Homepage:** https://www.blessbox.org
- **Dashboard:** https://www.blessbox.org/dashboard
- **Pricing:** https://www.blessbox.org/pricing
- **Help Center:** https://www.blessbox.org/help

## Support & Documentation

- **Documentation:** [docs/](docs/)
- **API Documentation:** [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- **Deployment Guide:** [documents/PRODUCTION_DEPLOYMENT_GUIDE.md](documents/PRODUCTION_DEPLOYMENT_GUIDE.md)
- **Test Coverage:** [documents/TEST_COVERAGE_ANALYSIS.md](documents/TEST_COVERAGE_ANALYSIS.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Acknowledgments

Built with modern best practices:
- **ISP (Interface Segregation Principle)** - Clean, focused interfaces
- **TDD (Test-Driven Development)** - Comprehensive test coverage
- **Real Database Integration** - No mocks, production-ready code
- **Security First** - Input validation, SQL injection prevention, XSS protection

---

**Production Status:** ✅ Live and Operational
**Last Updated:** November 2024
**Version:** 1.0.0
