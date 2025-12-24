# Scripts Index

> 🔧 Auto-generated index of all project scripts. Last updated: 11/24/2025

## 📊 Overview

- **Total Scripts**: 30
- **Categories**: 5
- **Executable**: 13 scripts

## 📑 Table of Contents

- [⚙️ Setup & Installation](#setup-installation)
- [🔨 Build Scripts](#build-scripts)
- [🧪 Testing Scripts](#testing-scripts)
- [🗄️ Database Scripts](#database-scripts)
- [🔧 Utility Scripts](#utility-scripts)

## ⚙️ Setup & Installation

*Scripts for project setup and dependency installation*

### [`setup-environment.ts`](setup-environment.ts)
**Usage:**
```bash
node setup-environment.ts
```

*Language: typescript • ✗ Not executable*

### [`setup-sqlite-db.js`](setup-sqlite-db.js)
Create SQLite client

**Usage:**
```bash
node setup-sqlite-db.js
```

*Language: javascript • ✗ Not executable*

### [`setup-square-vercel.sh`](setup-square-vercel.sh)
Square Payment Configuration for Vercel

**Usage:**
```bash
./setup-square-vercel.sh
```

*Language: bash • ✓ Executable*

### [`setup-vercel.sh`](setup-vercel.sh)
BlessBox Vercel Environment Setup Script

**Usage:**
```bash
./setup-vercel.sh [arguments]
```

*Language: bash • ✓ Executable • ⚠️ Requires arguments*

## 🔨 Build Scripts

*Scripts for building and compiling the project*

### [`build-tutorials.ts`](build-tutorials.ts)
Use tsc to compile tutorial files

**Usage:**
```bash
node build-tutorials.ts
```

*Language: typescript • ✗ Not executable*

## 🧪 Testing Scripts

*Scripts for running tests and generating coverage*

### [`run-e2e-tests.js`](run-e2e-tests.js)
**Usage:**
```bash
node run-e2e-tests.js
```

*Language: javascript • ✓ Executable*

### [`run-production-tests.sh`](run-production-tests.sh)
Run all production E2E tests

**Usage:**
```bash
./run-production-tests.sh
```

*Language: bash • ✓ Executable*

### [`test-tech.sh`](test-tech.sh)
Tech smoke tests for **Email (SendGrid)** + **Payments (Square)**.
Loads a `.env` file directly, validates provider credentials (non-charging), and can optionally verify a deployed base URL.

**Usage:**
```bash
./test-tech.sh --env-file .env.sandbox
./test-tech.sh --env-file .env.production --base-url https://www.blessbox.org
./test-tech.sh --env-file .env.production --base-url https://www.blessbox.org --email-to you@example.com --send-test-email
```

*Language: bash • ✓ Executable*

### [`run-tutorial-tests-repeatedly.sh`](run-tutorial-tests-repeatedly.sh)
Tutorial E2E Test Reliability Checker

**Usage:**
```bash
./run-tutorial-tests-repeatedly.sh
```

*Language: bash • ✓ Executable*

### [`test-app-connection.js`](test-app-connection.js)
Set environment variables

**Usage:**
```bash
node test-app-connection.js
```

*Language: javascript • ✗ Not executable*

### [`test-data-seeder.ts`](test-data-seeder.ts)
Test organization ID that matches the test suite

**Usage:**
```bash
node test-data-seeder.ts [arguments]
```

*Language: typescript • ✗ Not executable • ⚠️ Requires arguments*

### [`test-db.ts`](test-db.ts)
Set environment variables

**Usage:**
```bash
node test-db.ts
```

*Language: typescript • ✗ Not executable*

### [`test-registration-api.js`](test-registration-api.js)
Test the database connection and queries directly

**Usage:**
```bash
node test-registration-api.js
```

*Language: javascript • ✗ Not executable*

### [`test-sendgrid-direct.js`](test-sendgrid-direct.js)
Load environment variables from .env.local

**Usage:**
```bash
node test-sendgrid-direct.js [arguments]
```

*Language: javascript • ✓ Executable • ⚠️ Requires arguments*

### [`test-sendgrid-environments.js`](test-sendgrid-environments.js)
Color codes for terminal output

**Usage:**
```bash
node test-sendgrid-environments.js
```

*Language: javascript • ✓ Executable*

### [`test-sendgrid-standalone.js`](test-sendgrid-standalone.js)
**Usage:**
```bash
node test-sendgrid-standalone.js
```

*Language: javascript • ✓ Executable*

### [`test-square-environments.js`](test-square-environments.js)
**Usage:**
```bash
node test-square-environments.js [arguments]
```

*Language: javascript • ✓ Executable • ⚠️ Requires arguments*

### [`test-turso-connection.js`](test-turso-connection.js)
Set environment variables

**Usage:**
```bash
node test-turso-connection.js
```

*Language: javascript • ✗ Not executable*

### [`test-tutorial-reliability.sh`](test-tutorial-reliability.sh)
Tutorial System Reliability Tester

**Usage:**
```bash
./test-tutorial-reliability.sh
```

*Language: bash • ✓ Executable*

## 🗄️ Database Scripts

*Scripts for database operations, migrations, and seeding*

### [`seed-demo-data.js`](seed-demo-data.js)
Create database client

**Usage:**
```bash
node seed-demo-data.js
```

*Language: javascript • ✗ Not executable*

## 🔧 Utility Scripts

*General utility and helper scripts*

### [`add-checkin-fields.js`](add-checkin-fields.js)
🎉 JOYFUL CHECK-IN MIGRATION SCRIPT - ADDING MAGICAL FIELDS! ✨

**Usage:**
```bash
node add-checkin-fields.js
```

*Language: javascript • ✗ Not executable*

### [`check-cli-tools.sh`](check-cli-tools.sh)
BlessBox CLI Tools Quick Check Script

**Usage:**
```bash
./check-cli-tools.sh [arguments]
```

*Language: bash • ✓ Executable • ⚠️ Requires arguments*

### [`check-mailhog.js`](check-mailhog.js)
Check if a local MailHog instance is running (UI at 8025, SMTP at 1025)

**Usage:**
```bash
node check-mailhog.js
```

*Language: javascript • ✗ Not executable*

### [`check-sendgrid-account.js`](check-sendgrid-account.js)
Load environment variables from .env.local

**Usage:**
```bash
node check-sendgrid-account.js
```

*Language: javascript • ✗ Not executable*

### [`create-turso-schema.js`](create-turso-schema.js)
Load environment variables from .env.local

**Usage:**
```bash
node create-turso-schema.js
```

*Language: javascript • ✗ Not executable*

### [`run-mailhog.sh`](run-mailhog.sh)
**Usage:**
```bash
./run-mailhog.sh
```

*Language: bash • ✗ Not executable*

### [`run-migration.js`](run-migration.js)
Load environment variables

**Usage:**
```bash
node run-migration.js
```

*Language: javascript • ✓ Executable*

### [`start.sh`](start.sh)
Kill any running processes

**Usage:**
```bash
./start.sh
```

*Language: bash • ✓ Executable*

### [`stop-mailhog.sh`](stop-mailhog.sh)
**Usage:**
```bash
./stop-mailhog.sh
```

*Language: bash • ✗ Not executable*

### [`update-turso-schema.js`](update-turso-schema.js)
🎉 JOYFUL TURSO SCHEMA UPDATE - Adding passwordless magic! ✨

**Usage:**
```bash
node update-turso-schema.js
```

*Language: javascript • ✗ Not executable*

### [`validate-environment.ts`](validate-environment.ts)
Load environment variables

**Usage:**
```bash
node validate-environment.ts
```

*Language: typescript • ✗ Not executable*

---

*This index is automatically generated by devibe. Do not edit manually.*
