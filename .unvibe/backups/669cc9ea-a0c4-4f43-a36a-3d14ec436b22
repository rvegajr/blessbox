# 🔐 NextAuth Email Provider Enablement Checklist

## **Overview**
This checklist provides a complete step-by-step guide to enable the NextAuth Email Provider (magic link authentication) in your BlessBox application.

## **📋 Prerequisites Check**

### **Current State Analysis**
- [ ] **NextAuth v5 Beta**: ✅ Already installed (`next-auth@5.0.0-beta.25`)
- [ ] **Drizzle ORM**: ✅ Already installed (`drizzle-orm@0.44.4`)
- [ ] **Database Schema**: ✅ Custom schema exists (SQLite with Drizzle)
- [ ] **Email Service**: ✅ Custom EmailService with SendGrid/SMTP
- [ ] **Authentication Flow**: ✅ Credentials provider working

### **Issues Identified**
- [ ] **Missing Adapter**: NextAuth Email provider requires database adapter
- [ ] **No NextAuth Tables**: Missing required NextAuth database tables
- [ ] **Configuration Conflict**: Email provider enabled but no adapter configured

---

## **🚀 Implementation Steps**

### **Step 1: Install Required Dependencies**

#### **1.1 Install NextAuth Drizzle Adapter**
```bash
npm install @auth/drizzle-adapter
```

#### **1.2 Verify Installation**
```bash
npm list @auth/drizzle-adapter
```

**Expected Output**: Should show `@auth/drizzle-adapter@latest` installed

---

### **Step 2: Create NextAuth Database Tables**

#### **2.1 Create NextAuth Schema File**
Create file: `src/lib/database/nextauth-schema.ts`

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// NextAuth.js required tables
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull(),
  expires: integer('expires').notNull(),
});

export const users = sqliteTable('nextauth_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }),
  image: text('image'),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires').notNull(),
});

// Indexes for performance
export const accountsIndex = index('accounts_user_id_idx').on(accounts.userId);
export const sessionsIndex = index('sessions_user_id_idx').on(sessions.userId);
export const usersIndex = index('nextauth_users_email_idx').on(users.email);
export const verificationTokensIndex = index('verification_tokens_identifier_token_idx').on(verificationTokens.identifier, verificationTokens.token);
```

#### **2.2 Update Main Schema File**
Add to `src/lib/database/schema.ts`:

```typescript
// Import NextAuth tables
export * from './nextauth-schema';
```

#### **2.3 Generate Database Migration**
```bash
npx drizzle-kit generate
```

#### **2.4 Apply Migration**
```bash
npx drizzle-kit push
```

**Verification**: Check that new tables are created:
- `accounts`
- `sessions` 
- `nextauth_users`
- `verification_tokens`

---

### **Step 3: Update NextAuth Configuration**

#### **3.1 Install Drizzle Adapter in Auth Config**
Update `src/lib/auth.ts`:

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './database/connection'
import { accounts, sessions, users, verificationTokens } from './database/nextauth-schema'
// ... existing imports

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_USER,
    }),
    CredentialsProvider({
      // ... existing credentials config
    }),
  ],
  // ... rest of existing config
})
```

#### **3.2 Update Session Strategy**
Ensure session strategy is set correctly:

```typescript
session: {
  strategy: 'database', // Changed from 'jwt' to 'database'
},
```

---

### **Step 4: Environment Variables Configuration**

#### **4.1 Verify SMTP Configuration**
Ensure these environment variables are set in `.env.local`:

```env
# SMTP Configuration (for Email Provider)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:7777
```

#### **4.2 Test SMTP Connection**
Create test file: `test-smtp.js`

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP Error:', error);
  } else {
    console.log('SMTP Ready:', success);
  }
});
```

Run: `node test-smtp.js`

---

### **Step 5: Update Login Page**

#### **5.1 Add Magic Link Option**
Update `src/app/auth/login/page.tsx`:

```typescript
// Add magic link handler
const handleMagicLink = async () => {
  setIsLoading(true)
  setError('')

  try {
    const result = await signIn('email', {
      email,
      redirect: false,
    })

    if (result?.error) {
      setError('Failed to send magic link')
    } else {
      setError('Check your email for a magic link')
    }
  } catch (error) {
    setError('An error occurred')
  } finally {
    setIsLoading(false)
  }
}

// Add magic link button in JSX:
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={handleMagicLink}
  disabled={isLoading}
>
  Send Magic Link
</Button>
```

---

### **Step 6: Database Schema Migration**

#### **6.1 Backup Current Database**
```bash
cp blessbox.db blessbox.db.backup
```

#### **6.2 Run Migration**
```bash
npx drizzle-kit push
```

#### **6.3 Verify Tables Created**
```bash
sqlite3 blessbox.db ".tables"
```

**Expected Tables**:
- `accounts`
- `sessions`
- `nextauth_users`
- `verification_tokens`
- Plus all existing tables

---

### **Step 7: Testing & Verification**

#### **7.1 Start Development Server**
```bash
npm run dev
```

#### **7.2 Test Authentication Endpoints**
```bash
# Test providers endpoint
curl http://localhost:7777/api/auth/providers

# Expected response should include "email" provider
```

#### **7.3 Test Magic Link Flow**
1. Navigate to `/auth/login`
2. Enter email address
3. Click "Send Magic Link"
4. Check email for magic link
5. Click magic link
6. Verify automatic login

#### **7.4 Test Credentials Flow**
1. Navigate to `/auth/login`
2. Enter email and password
3. Click "Sign in"
4. Verify login works

#### **7.5 Test Session Management**
1. Login with either method
2. Navigate to `/dashboard`
3. Verify session persists
4. Test logout functionality

---

### **Step 8: Production Deployment**

#### **8.1 Update Production Environment**
Ensure production `.env` has:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_production_sendgrid_key
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-domain.com
```

#### **8.2 Run Production Migration**
```bash
# On production server
npx drizzle-kit push
```

#### **8.3 Test Production Authentication**
1. Test magic link on production
2. Test credentials on production
3. Verify email delivery
4. Test session persistence

---

## **🔧 Troubleshooting**

### **Common Issues & Solutions**

#### **Issue 1: MissingAdapter Error**
**Symptoms**: `[auth][error] MissingAdapter: Email login requires an adapter`
**Solution**: 
- [ ] Install `@auth/drizzle-adapter`
- [ ] Add adapter to NextAuth config
- [ ] Create NextAuth database tables

#### **Issue 2: Database Migration Fails**
**Symptoms**: `SQLITE_ERROR: table already exists`
**Solution**:
- [ ] Check if tables already exist
- [ ] Use `npx drizzle-kit push --force` if needed
- [ ] Verify schema matches database

#### **Issue 3: SMTP Connection Fails**
**Symptoms**: `Error: Invalid login`
**Solution**:
- [ ] Verify SendGrid API key
- [ ] Check SMTP credentials
- [ ] Test with `test-smtp.js`

#### **Issue 4: Magic Link Not Working**
**Symptoms**: Email sent but link doesn't work
**Solution**:
- [ ] Check `NEXTAUTH_URL` environment variable
- [ ] Verify email template
- [ ] Check database for verification tokens

#### **Issue 5: Session Not Persisting**
**Symptoms**: User logged out on page refresh
**Solution**:
- [ ] Change session strategy to `database`
- [ ] Verify sessions table exists
- [ ] Check session configuration

---

## **✅ Final Verification Checklist**

### **Authentication Features**
- [ ] **Magic Link Login**: Users can login with email magic link
- [ ] **Credentials Login**: Users can login with email/password
- [ ] **Session Persistence**: Sessions persist across page refreshes
- [ ] **Logout Functionality**: Users can logout properly
- [ ] **Email Delivery**: Magic links are sent via SendGrid

### **Database Integration**
- [ ] **NextAuth Tables**: All required tables created
- [ ] **User Data**: User data properly stored
- [ ] **Session Data**: Sessions properly managed
- [ ] **Token Management**: Verification tokens working

### **Production Readiness**
- [ ] **Environment Variables**: All production env vars set
- [ ] **Database Migration**: Production database updated
- [ ] **Email Service**: SendGrid working in production
- [ ] **Security**: Proper secrets and keys configured

---

## **🎯 Success Criteria**

### **User Experience**
- Users can choose between magic link or password login
- Magic links are delivered quickly via SendGrid
- Login process is smooth and intuitive
- Sessions persist across browser sessions

### **Technical Requirements**
- No more `MissingAdapter` errors
- NextAuth Email provider fully functional
- Database adapter properly configured
- All authentication flows working

### **Production Ready**
- All tests passing
- No authentication errors in logs
- Email delivery working
- Database migrations successful

---

## **📚 Additional Resources**

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Drizzle Adapter Documentation](https://authjs.dev/reference/adapter/drizzle)
- [SendGrid SMTP Documentation](https://docs.sendgrid.com/for-developers/sending-email/smtp)
- [SQLite Database Documentation](https://www.sqlite.org/docs.html)

---

**Note**: This checklist assumes you're using SQLite with Drizzle ORM. If using a different database, adjust the adapter and schema accordingly.

