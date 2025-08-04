# 🗄️ BlessBox Database Setup Guide

## Quick Start

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE blessbox;
CREATE USER blessbox_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE blessbox TO blessbox_user;

# Exit psql
\q
```

### 3. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env.local
```

Update `.env.local` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blessbox
DB_USER=blessbox_user
DB_PASSWORD=your_secure_password
```

### 4. Setup Database Schema

```bash
# Generate and run migrations
npm run db:generate
npm run db:setup
```

### 5. Test Connection

```bash
# Test the database connection
curl http://localhost:7777/api/database/test-connection
```

You should see:
```json
{
  "success": true,
  "message": "✅ Database connection successful!",
  "timestamp": "2025-01-04T19:20:00.000Z"
}
```

## Database Schema

### Organizations Table
- **Purpose**: Store organization/event information
- **Key Fields**: `name`, `contact_email`, `custom_domain`, `email_verified`
- **Relationships**: One-to-many with QR Code Sets

### QR Code Sets Table
- **Purpose**: Store QR code configurations and form definitions
- **Key Fields**: `name`, `language`, `form_fields` (JSON), `qr_codes` (JSON)
- **Relationships**: Belongs to Organization, One-to-many with Registrations

### Registrations Table
- **Purpose**: Store form submissions from QR code scans
- **Key Fields**: `registration_data` (JSON), `qr_code_id`, `ip_address`
- **Relationships**: Belongs to QR Code Set

### Verification Codes Table
- **Purpose**: Store email verification codes
- **Key Fields**: `email`, `code`, `expires_at`, `attempts`
- **Security**: Codes expire in 15 minutes, max 5 attempts

## Development Tools

### Drizzle Studio (Database GUI)
```bash
npm run db:studio
```
Opens a web-based database browser at `http://localhost:4983`

### Migration Commands
```bash
# Generate new migration
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Setup database from scratch
npm run db:setup
```

## Production Deployment

### Environment Variables
```env
DB_HOST=your-production-host
DB_PORT=5432
DB_NAME=blessbox_production
DB_USER=blessbox_prod_user
DB_PASSWORD=super_secure_production_password
DB_SSL=true
DB_MAX_CONNECTIONS=20
```

### Recommended Services
- **Heroku Postgres**: Easy setup, good for MVPs
- **AWS RDS**: Scalable, production-ready
- **DigitalOcean Managed Databases**: Cost-effective
- **Supabase**: PostgreSQL with built-in features

## Security Best Practices

1. **Never commit `.env.local`** - Contains sensitive credentials
2. **Use strong passwords** - At least 16 characters
3. **Enable SSL in production** - Set `DB_SSL=true`
4. **Limit database user permissions** - Only grant necessary privileges
5. **Regular backups** - Automate database backups
6. **Monitor connections** - Set appropriate connection limits

## Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U blessbox_user -d blessbox
```

### Migration Issues
```bash
# Reset database (WARNING: Deletes all data)
npm run db:setup

# Check migration status
npm run db:studio
```

### Common Errors

**"database does not exist"**
- Create the database: `CREATE DATABASE blessbox;`

**"password authentication failed"**
- Check credentials in `.env.local`
- Verify user exists: `\du` in psql

**"connection refused"**
- PostgreSQL is not running
- Wrong host/port in configuration

## Next Steps

Once your database is set up:
1. ✅ **Database Integration** - COMPLETED
2. 🔄 **Authentication System** - Next up!
3. 📝 **Registration Forms** - Coming soon
4. 🔒 **Security Hardening** - Final step

Happy coding! 🚀