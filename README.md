# BlessBox

## Project Overview
BlessBox is a streamlined QR-based registration and verification system designed for organizations managing events like food distributions, seminar registrations, and volunteer sign-ups.

## Features
- **Organization Setup**: Simple registration and login system for organizations
- **QR Code Generation**: Create custom QR codes for different event types
- **Mobile-Friendly Scanning**: Users scan QR codes and fill forms on their phones
- **Real-time Verification**: Staff can verify registrations and take appropriate actions
- **Responsive Design**: Scales beautifully from mobile to large desktop screens
- **Square Payment Integration**: Real payment processing with Square
- **Multi-Entry QR Codes**: Track different entry points (doors, lanes, etc.)
- **Subscription Management**: Free, Standard, and Enterprise plans
- **Passwordless Authentication**: Email-based login with verification codes

## 🔐 **SUPER ADMIN ACCESS**

For development and system administration, use these credentials:

**Super Admin Email**: `admin@blessbox.app`  
**Super Admin Password**: `BlessBox2024!Admin`

> 🚨 **IMPORTANT**: Change these credentials in production! These are for development only.

### Default Test Accounts
- **Test Organization**: `test@example.com` / `TestPassword123!`
- **Demo Organization**: `demo@blessbox.app` / `DemoPassword123!`

## Template Integrations
- Tailwind CSS v4  
- Astro SEO - Powered by [@astrolib/seo](https://github.com/onwidget/astrolib/tree/main/packages/seo)
- Astro Sitemap - https://docs.astro.build/en/guides/integrations-guide/sitemap/

## Template Structure

The template follows a typical Astro project structure. You'll find the following key directories and files:


```
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

- `src/pages/`: Contains `.astro` and `.md` files. Each file becomes a route in your project based on its name.
- `src/components/`: Ideal for placing your Astro/React/Vue/Svelte/Preact components.
- `public/`: For static assets such as images that you want to serve directly.

## 🚀 **QUICK START**

### 1. Environment Setup
Create a `.env.local` file in the root directory:

```bash
# Database Configuration (Turso)
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Email Configuration (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Square Payment Configuration
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_ENVIRONMENT=sandbox

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# App URL
PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run db:migrate`   | Run database migrations                          |
| `npm run test`         | Run unit tests with Vitest                      |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## 🔗 **API ENDPOINTS**

### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login (password or verification code)
- `POST /api/auth/request-login-code` - Request passwordless login code

### Onboarding
- `POST /api/onboarding/send-verification` - Send email verification code
- `POST /api/onboarding/generate-qr` - Generate QR codes with entry points

### Registration
- `POST /api/registration/submit` - Submit registration form
- `GET /api/registration/form/[qrCodeId]` - Get registration form data

### Payments
- `POST /api/payment/create-intent` - Create payment intent
- `POST /api/payment/process` - Process Square payment
- `POST /api/payment/validate-coupon` - Validate coupon codes

### Testing
- `POST /api/test-email` - Test email system
- `GET /api/contact` - Test contact form

## 🎯 **REGISTRATION URLS**

QR codes generate user-friendly URLs like:
- `https://blessbox.app/register/acme-corp/main-entrance`
- `https://blessbox.app/register/food-bank/west-door`
- `https://blessbox.app/register/conference/vip-entrance`

## 🏗️ **ARCHITECTURE HIGHLIGHTS**

- **Interface Segregation Principle (ISP)** - Clean, focused interfaces
- **Test-Driven Development (TDD)** - Comprehensive test coverage
- **Real Database Integration** - Turso SQLite with zero mocks
- **Square Payment Processing** - Real money transactions
- **Multi-Entry QR Codes** - Track specific doors/lanes
- **Passwordless Authentication** - Email-based login system
- **Subscription Management** - Free, Standard, Enterprise plans

## 📁 **KEY DIRECTORIES**

```
src/
├── interfaces/           # ISP-compliant interfaces
├── implementations/      # Service implementations
├── pages/api/           # API endpoints
├── pages/register/      # Dynamic registration forms
├── database/            # Schema and connections
├── providers/           # Email providers (Gmail, SendGrid)
└── tests/              # TDD test suites
```

## 🚀 **VERCEL DEPLOYMENT**

### Branch-Based Deployments
- **Production** (`main` branch): `https://blessbox.vercel.app`
- **Development** (`development` branch): `https://blessbox-git-development.vercel.app`

### Environment Variables Setup in Vercel

#### Production Environment Variables:
```bash
TURSO_DATABASE_URL=libsql://blessbox-prod.turso.io
TURSO_AUTH_TOKEN=your-prod-auth-token
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-prod-square-token
SQUARE_ENVIRONMENT=production
JWT_SECRET=your-super-secret-jwt-key
PUBLIC_APP_URL=https://blessbox.vercel.app
```

#### Development Environment Variables:
```bash
TURSO_DATABASE_URL=libsql://blessbox-dev.turso.io
TURSO_AUTH_TOKEN=your-dev-auth-token
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-sandbox-square-token
SQUARE_ENVIRONMENT=sandbox
JWT_SECRET=your-dev-jwt-secret
PUBLIC_APP_URL=https://blessbox-git-development.vercel.app
```

### Vercel CLI Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Set environment variables
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
# ... add all other variables

# Deploy specific branch
vercel --prod  # for main branch
vercel         # for development branch
```

### Automatic Deployments
With the `vercel.json` configuration:
- **Push to `main`** → Deploys to production
- **Push to `development`** → Deploys to dev environment
- **Pull Requests** → Creates preview deployments

Learn more - Explore more through Astro's official [documentation](https://docs.astro.build).

---

🎉 **Built with ORGASMIC JOY by the HAPPIEST developers in the universe!** 🚀✨

----------------------------
Updated on 27th March 2025
- Change LimeStripe iframe for PNG image because of performance issues. No visuals affecrted 


----------------------------
Updated on 23th March 2025

## This update includes:
- Added Fuse Js Search on: Blog, Help Center, Jobs and Integrations.
- AOS Animation on
- Full redesign
- Activated AOS

On this version, Tailwind CSS is now V4, this means that there's no `tailwind.config.mjs` file anymore. 
From now on, all style will be added on the `css` file. You can find the styles on the `src/styles/global.css` file.

- Added Image component from Astro
The Astro Image component is coming back to the themes

- Reusable components
This template now includes reusable components, such as the `Text`, `Button`, `Link` and `Wrapper` components.

- Text Component  
A versatile and reusable component for handling text across your project, ensuring consistency and easy customization.  

- **HTML Tags:** Easily change the HTML element (like `p`, `h1`, `span`, `a`) using the `tag` prop, with `p` being the default.  
- **Variants:** Pick from preset text styles (such as `displayXL` or `textBase`) for a consistent look.  
- **Custom Classes:** Add or adjust styles with the `class` prop.  
- **Accessibility:** Customize with additional props like `id`, `href`, `title`, and `style`.  
- **Content Slot:** Add any content inside the component, including optional left and right icons. 
Example usage:
```astro
<Text tag="h1" variant="displayXL" class="text-center">
  Welcome to the new version!
</Text>
``` 

- Button Component  
A customizable button component with options to fit your design needs:  

- **Variants:** Choose from predefined styles like `primary` (dark background) and `secondary` (lighter background), with support for dark mode.  
- **Sizes:** Select `small` or `medium` for different button heights and padding.  
- **Gaps:** Control the spacing between content with the `gapSize` prop (either `small` or `medium`).  
- **Custom Classes:** Apply additional styles using the `class` prop.  
- **Slots:** Include icons or extra content with optional `left-icon` and `right-icon` slots.  
Example usage:
```astro
<Button size="small" variant="primary">Primary small</Button>
```

-  Wrapper Component  
A flexible layout component that helps with consistent spacing and alignment.  

- **Variants:** The default `standard` variant includes responsive widths, centered content, and padding.  
- **Custom Classes:** Add or change styles with the `class` prop.  
- **Content Slot:** Easily add any child components or content inside.

```astro
<Wrapper variant="standard">
Your content goes here
</Wrapper>
```
-----
------
Updated on 30th December 2024

## This update includes:
- Added Tailwind CSS v4
On this version, Tailwind CSS is now beta version from Tailwind CSS V4, this means that there's no `tailwind.config.mjs` file anymore. From now on, all style will be added on the `css` file. You can find the styles on the `src/styles/global.css` file.

- Astro V5
This update includes Astro V5, which is a major update that includes several new features and improvements.


- Astro SEO by @astrolib/seo
This update includes the integration of the Astro SEO package by @astrolib/seo, is an integration that makes managing your SEO easier in Astro projects. It is fully based on the excellent Next SEO library

### [Support](https://lexingtonthemes.com/legal/support/)
  ### [Documentation](https://lexingtonthemes.com/documentation/)
### [Get your bundle](https://lexingtonthemes.com)