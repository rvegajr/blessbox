import { createClient } from '@libsql/client';

export async function ensureLibsqlSchema(config?: { url?: string; authToken?: string }) {
  const url = config?.url || process.env.TURSO_DATABASE_URL || 'file:./.tmp/test-db.sqlite';
  const authToken = config?.authToken || process.env.TURSO_AUTH_TOKEN || '';
  const client = createClient({ url, authToken });

  // Idempotent schema creation for libsql/sqlite
  const statements: string[] = [
    // organizations
    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      event_name TEXT,
      custom_domain TEXT UNIQUE,
      contact_email TEXT NOT NULL UNIQUE,
      contact_phone TEXT,
      contact_address TEXT,
      contact_city TEXT,
      contact_state TEXT,
      contact_zip TEXT,
      password_hash TEXT,
      last_login_at TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );`,

    // qr_code_sets
    `CREATE TABLE IF NOT EXISTS qr_code_sets (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      form_fields TEXT NOT NULL,
      qr_codes TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      scan_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,

    // registrations
    `CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      qr_code_set_id TEXT NOT NULL,
      qr_code_id TEXT NOT NULL,
      organization_id TEXT,
      registration_data TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'pending',
      delivered_at TEXT,
      registered_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      check_in_token TEXT UNIQUE,
      checked_in_at TEXT,
      checked_in_by TEXT,
      token_status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (qr_code_set_id) REFERENCES qr_code_sets(id) ON DELETE CASCADE
    );`,

    // verification_codes
    `CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      expires_at TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0
    );`,

    // login_codes
    `CREATE TABLE IF NOT EXISTS login_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      expires_at TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0
    );`,

    // subscription_plans
    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      registration_limit INTEGER NOT NULL,
      current_registration_count INTEGER NOT NULL DEFAULT 0,
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      current_period_start TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      current_period_end TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      payment_provider TEXT DEFAULT 'square',
      external_subscription_id TEXT,
      start_date TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,

    // payment_transactions
    `CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      subscription_plan_id TEXT,
      square_payment_id TEXT,
      plan_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      payment_provider TEXT NOT NULL DEFAULT 'square',
      customer_email TEXT,
      coupon_code TEXT,
      coupon_discount INTEGER,
      receipt_url TEXT,
      failure_reason TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
    );`,

    // usage_tracking
    `CREATE TABLE IF NOT EXISTS usage_tracking (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      registration_count INTEGER NOT NULL DEFAULT 0,
      qr_code_scans INTEGER NOT NULL DEFAULT 0,
      export_count INTEGER NOT NULL DEFAULT 0,
      search_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,

    // saved_searches
    `CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      search_query TEXT NOT NULL,
      filters TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,

    // export_jobs
    `CREATE TABLE IF NOT EXISTS export_jobs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      format TEXT NOT NULL,
      file_name TEXT NOT NULL,
      download_url TEXT,
      total_records INTEGER NOT NULL DEFAULT 0,
      processed_records INTEGER NOT NULL DEFAULT 0,
      filters TEXT NOT NULL,
      options TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      completed_at TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,

    // coupon_codes
    `CREATE TABLE IF NOT EXISTS coupon_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      usage_limit INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      valid_from TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      valid_until TEXT
    );`,

    // classes
    `CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      capacity INTEGER NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );`,

    // class_sessions
    `CREATE TABLE IF NOT EXISTS class_sessions (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL,
      session_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      location TEXT,
      instructor_name TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );`,

    // participants
    `CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );`,

    // enrollments
    `CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES class_sessions(id) ON DELETE CASCADE,
      enrollment_status TEXT NOT NULL DEFAULT 'pending',
      enrolled_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      confirmed_at TEXT,
      attended_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );`,

    // usage_alerts
    `CREATE TABLE IF NOT EXISTS usage_alerts (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      type TEXT NOT NULL,
      threshold INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      acknowledged_at TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,

    // indexes
    `CREATE INDEX IF NOT EXISTS qr_code_sets_organization_id_idx ON qr_code_sets(organization_id);`,
    `CREATE INDEX IF NOT EXISTS registrations_qr_code_set_id_idx ON registrations(qr_code_set_id);`,
    `CREATE INDEX IF NOT EXISTS registrations_delivery_status_idx ON registrations(delivery_status);`,
    `CREATE INDEX IF NOT EXISTS registrations_registered_at_idx ON registrations(registered_at);`,
    `CREATE INDEX IF NOT EXISTS registrations_check_in_token_idx ON registrations(check_in_token);`,
    `CREATE INDEX IF NOT EXISTS registrations_token_status_idx ON registrations(token_status);`,
    `CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes(email);`,
    `CREATE INDEX IF NOT EXISTS login_codes_expires_at_idx ON login_codes(expires_at);`,
    `CREATE INDEX IF NOT EXISTS subscription_plans_organization_id_idx ON subscription_plans(organization_id);`,
    `CREATE INDEX IF NOT EXISTS subscription_plans_plan_type_idx ON subscription_plans(plan_type);`,
    `CREATE INDEX IF NOT EXISTS payment_transactions_organization_id_idx ON payment_transactions(organization_id);`,
    `CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON payment_transactions(status);`,
    `CREATE INDEX IF NOT EXISTS payment_transactions_created_at_idx ON payment_transactions(created_at);`,
    `CREATE INDEX IF NOT EXISTS usage_tracking_org_date_idx ON usage_tracking(organization_id, date);`,
    `CREATE INDEX IF NOT EXISTS saved_searches_organization_id_idx ON saved_searches(organization_id);`,
    `CREATE INDEX IF NOT EXISTS export_jobs_organization_id_idx ON export_jobs(organization_id);`,
    `CREATE INDEX IF NOT EXISTS export_jobs_status_idx ON export_jobs(status);`,
    `CREATE INDEX IF NOT EXISTS export_jobs_created_at_idx ON export_jobs(created_at);`,
    `CREATE INDEX IF NOT EXISTS coupon_codes_code_idx ON coupon_codes(code);`,
    `CREATE INDEX IF NOT EXISTS coupon_codes_is_active_idx ON coupon_codes(is_active);`,
    `CREATE INDEX IF NOT EXISTS classes_organization_id_idx ON classes(organization_id);`,
    `CREATE INDEX IF NOT EXISTS class_sessions_class_id_idx ON class_sessions(class_id);`,
    `CREATE INDEX IF NOT EXISTS participants_organization_id_idx ON participants(organization_id);`,
    `CREATE INDEX IF NOT EXISTS participants_email_idx ON participants(email);`,
    `CREATE INDEX IF NOT EXISTS enrollments_class_id_idx ON enrollments(class_id);`,
    `CREATE INDEX IF NOT EXISTS enrollments_participant_id_idx ON enrollments(participant_id);`,
    `CREATE INDEX IF NOT EXISTS enrollments_session_id_idx ON enrollments(session_id);`
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  // Lightweight migrations for older local DB files (safe to re-run; ignore "duplicate column" errors)
  const tryExec = async (sql: string) => {
    try {
      await client.execute(sql);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/duplicate column name/i.test(msg) || /already exists/i.test(msg)) return;
      // Some libsql/sqlite builds may return generic errors; keep them visible
      throw e;
    }
  };

  // Ensure registrations has organization_id (older DBs created before we added it)
  await tryExec(`ALTER TABLE registrations ADD COLUMN organization_id TEXT;`);

  // Ensure subscription_plans has the columns used by /lib/subscriptions (older DBs used different schema)
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN registration_limit INTEGER NOT NULL DEFAULT 100;`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN current_registration_count INTEGER NOT NULL DEFAULT 0;`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN billing_cycle TEXT NOT NULL DEFAULT 'monthly';`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN amount REAL;`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN current_period_start TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP);`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN current_period_end TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP);`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN payment_provider TEXT DEFAULT 'square';`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN external_subscription_id TEXT;`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN start_date TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP);`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN end_date TEXT;`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP);`);
  await tryExec(`ALTER TABLE subscription_plans ADD COLUMN updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP);`);

  return { success: true } as const;
}


