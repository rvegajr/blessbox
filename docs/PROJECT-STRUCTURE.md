# BlessBox Project Structure

## 📁 Root Directory
```
BlessBox/
├── README.md                 # Main project documentation
├── start.sh                  # Development server startup script
├── package.json              # Dependencies and scripts
├── astro.config.mjs          # Astro configuration
├── tsconfig.json             # TypeScript configuration
├── .env.local                # Email configuration (not in git)
├── .gitignore                # Git ignore rules
└── .github/                  # GitHub Actions workflows
```

## 📁 Source Code (`src/`)
```
src/
├── components/               # Astro components
│   ├── fundations/          # Base UI components
│   ├── blog/                # Blog-related components
│   ├── features/            # Feature components
│   └── global/              # Global components (Header, Footer)
├── content/                 # Content collections
├── layouts/                 # Page layouts
├── pages/                   # Route pages
│   ├── api/                 # API endpoints
│   └── forms/               # Form pages
├── styles/                  # Global styles
├── utils/                   # Utility functions
├── interfaces/              # TypeScript interfaces
├── providers/               # Email provider implementations
└── services/                # Business logic services
```

## 📁 Documentation (`docs/`)
```
docs/
├── PROJECT-STRUCTURE.md     # This file
├── ci-cd/                   # CI/CD documentation
│   ├── CI-CD-SETUP.md       # GitHub Actions setup guide
│   └── setup-branch-protection.sh # Branch protection script
└── email-setup/             # Email system documentation
    ├── gmail-setup-guide.js # Gmail setup guide
    ├── explain-gmail-smtp-relay.js # SMTP explanation
    └── interactive-gmail-setup.js # Interactive setup
```

## 📁 Scripts (`scripts/`)
```
scripts/
├── setup/                   # Setup scripts
│   ├── setup-gmail.sh       # Gmail configuration script
│   └── setup-sendgrid.sh    # SendGrid configuration script
└── tests/                   # Test scripts (development only)
    ├── test-*.js            # Various email tests
    ├── check-sendgrid-status.js # SendGrid diagnostics
    └── diagnose-sendgrid.js # SendGrid troubleshooting
```

## 🏗️ Email Architecture

### Abstracted Email System
- **Interface**: `src/interfaces/EmailProvider.ts`
- **Providers**: 
  - `src/providers/GmailProvider.ts` (Gmail SMTP)
  - `src/providers/SendGridProvider.ts` (SendGrid API)
- **Service**: `src/services/EmailService.ts` (Factory & Manager)
- **Utility**: `src/utils/email.ts` (Main API)

### Configuration
- **Environment**: `.env.local` (not in git)
- **Provider Switching**: Change `EMAIL_PROVIDER=gmail|sendgrid`
- **Setup Scripts**: `scripts/setup/`

## 🚀 Quick Start

1. **Install**: `npm install`
2. **Setup Email**: `./scripts/setup/setup-gmail.sh`
3. **Start Dev**: `./start.sh`
4. **Visit**: `http://localhost:7777`

## 📧 Email Features

- ✅ **Gmail SMTP Relay** - Free, reliable
- ✅ **SendGrid API** - Scalable, feature-rich  
- ✅ **Easy Switching** - Change provider anytime
- ✅ **Contact Forms** - Ready for production
- ✅ **Abstracted API** - Clean, maintainable code

## 🔧 Development

- **Email Testing**: Visit `/email-test`
- **Contact Form**: Visit `/forms/contact`
- **Provider Switch**: Update `EMAIL_PROVIDER` in `.env.local`
- **Add Provider**: Implement `EmailProvider` interface