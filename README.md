# BlessBox - Next.js QR-based Registration & Verification System

A comprehensive QR-based registration and verification system built with Next.js 15, featuring organization management, dynamic form building, QR code generation, and real-time analytics.

<!-- AUTO-INDEX-SECTION -->
<!--
🤖 AI ASSISTANT - PROJECT NAVIGATION GUIDE
============================================

To fully understand and work with this project, follow this systematic approach:

📚 STEP 1 - READ DOCUMENTATION: documents/INDEX.md
   This is your PRIMARY source for understanding the project:
   • Complete index of ALL project documentation
   • Organized by category (specifications, guides, architecture, etc.)
   • Read specifications FIRST to understand system design
   • Then read guides for implementation details
   • Every document is indexed with descriptions and word counts
   • This is the authoritative source - do not search randomly

🔧 STEP 2 - UNDERSTAND AVAILABLE SCRIPTS: scripts/INDEX.md
   This index shows you ALL tools and automation:
   • Categorized by purpose (setup, build, test, deploy, etc.)
   • Includes usage examples and requirements
   • Marked with executable status and required arguments
   • Shows which language each script uses

   ⚡ SCRIPT EXECUTION ORDER:
   1. Setup scripts - Run FIRST for project initialization
   2. Build scripts - Compile/build the project
   3. Test scripts - Verify functionality
   4. Deploy scripts - Deploy to environments

🎯 COMPLETE WORKFLOW:
   1. Read documents/INDEX.md to understand WHAT the project does
   2. Read scripts/INDEX.md to understand HOW to work with it
   3. Follow specifications → guides → implementation order
   4. Use scripts in order: setup → build → test → deploy

💡 KEY PRINCIPLES:
   • Both indexes are auto-generated and always up-to-date
   • Never search randomly - use the indexes as navigation
   • Read documentation before writing code
   • Check scripts before running manual commands
   • Word counts help prioritize what to read first

✅ AFTER READING BOTH INDEXES:
   You will have complete knowledge of:
   • System architecture and design decisions
   • Implementation details and best practices
   • All available automation and tooling
   • Proper setup, build, test, and deployment procedures

============================================
-->

## 📚 Documentation & Scripts

**Quick Links:**
- 🚀 **[START HERE - Tutorial System](START_HERE.md)** - See the new tutorial system in action!
- 📖 **[Documentation Index](documents/INDEX.md)** - Complete project documentation
- 🔧 **[Scripts Index](scripts/INDEX.md)** - All available scripts and tools

### 🎓 New! Interactive Tutorial System

BlessBox now includes a **non-intrusive, opt-in tutorial system** to help users learn the application:

- ✨ **Try the Demo:** Visit `/tutorial-demo` to see all components in action
- 📱 **Dashboard Tour:** Click the blue ? button on `/dashboard`
- 📖 **Full Guide:** See [START_HERE.md](START_HERE.md) for complete documentation

**Key Features:**
- Floating tutorial buttons (always optional, never forced)
- Contextual help tooltips
- Empty state guidance
- 6 pre-built tutorials ready to use

<!-- AUTO-INDEX-SECTION -->

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite database (or Turso for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BlessBox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="file:./blessbox.db"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:7777"
   
   # Email Configuration
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # Square Payment (Optional)
   SQUARE_APPLICATION_ID="your-square-app-id"
   SQUARE_ACCESS_TOKEN="your-square-access-token"
   SQUARE_ENVIRONMENT="sandbox"
   ```

4. **Set up the database**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:7777](http://localhost:7777)

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js (Auth.js)
- **Email**: Nodemailer with SMTP
- **QR Codes**: QRCode library
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── onboarding/        # Onboarding flow
│   └── register/          # Registration pages
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── dashboard/        # Dashboard components
├── lib/                  # Utilities and configurations
├── services/             # Business logic services
├── interfaces/           # TypeScript interfaces
└── database/             # Database schema and connection
```

## 🎯 Features

### Core Functionality
- **Organization Management**: Create and manage multiple organizations
- **QR Code Generation**: Generate QR codes for events and registrations
- **Dynamic Forms**: Build custom registration forms
- **Email Verification**: Secure email verification system
- **Real-time Analytics**: Track QR code scans and registrations
- **Multi-tenant Support**: Support for multiple organizations

### Onboarding Flow
1. **Organization Setup**: Create organization with contact details
2. **Email Verification**: Verify organization email address
3. **Form Builder**: Create custom registration forms
4. **QR Configuration**: Set up QR codes and entry points
5. **Dashboard Access**: Complete setup and access dashboard

### QR Code System
- **QR Code Generation**: Real QR code image generation
- **Multiple Entry Points**: Different QR codes for different purposes
- **Analytics Tracking**: Track scans, conversions, and performance
- **Mobile Optimization**: Mobile-friendly registration flow

### Authentication & Security
- **NextAuth.js Integration**: Secure authentication system
- **Email Verification**: Multi-step email verification
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcryptjs for password security

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server on port 7777
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Database Management
```bash
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit studio      # Open database studio
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npx playwright test

# Test coverage
npm run test:coverage
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - Get user organizations
- `PUT /api/organizations/[id]` - Update organization

### Onboarding
- `POST /api/onboarding/organization-setup` - Organization setup
- `POST /api/onboarding/verify-email` - Email verification
- `POST /api/onboarding/resend-verification` - Resend verification
- `POST /api/onboarding/form-builder` - Form configuration
- `POST /api/onboarding/qr-configuration` - QR code setup

### QR Codes
- `POST /api/qr-codes` - Create QR code set
- `GET /api/qr-codes` - Get QR code sets
- `GET /api/qr-codes/[id]` - Get QR code set details
- `PUT /api/qr-codes/[id]` - Update QR code set
- `DELETE /api/qr-codes/[id]` - Delete QR code set

### Registrations
- `POST /api/registrations` - Create registration
- `GET /api/registrations` - Get registrations

### Dashboard
- `GET /api/dashboard/stats` - Get organization statistics
- `GET /api/dashboard/activities` - Get recent activities

## 🚀 Deployment

### Vercel Deployment
1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Set environment variables** in Vercel dashboard:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `DATABASE_URL`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | Secret for JWT signing | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |

## 🧪 Testing

### Unit Tests
- **Framework**: Vitest
- **Coverage**: V8 coverage reporting
- **Location**: `src/tests/`

### E2E Tests
- **Framework**: Playwright
- **Configuration**: `playwright.config.ts`
- **Location**: `tests/e2e/`

### Test Commands
```bash
# Run all tests
npm run test

# Run E2E tests
npx playwright test

# Run tests with coverage
npm run test:coverage
```

## 📝 Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Architecture Principles
- **Interface Segregation**: Focused, single-purpose interfaces
- **Test-Driven Development**: Write tests first
- **Real Implementations**: No mocks in production code
- **Event-Driven**: Decoupled components

### Component Guidelines
- **Server Components**: Use for data fetching
- **Client Components**: Use for interactivity
- **Error Boundaries**: Comprehensive error handling
- **Loading States**: Skeleton loaders for better UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- **Documentation**: Check this README
- **Issues**: Create a GitHub issue
- **Email**: Contact the development team

---

**BlessBox** - Streamlining organization registration and verification with QR codes.

