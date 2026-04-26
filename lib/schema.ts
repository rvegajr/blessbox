import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// Schema reconciled with live blessbox.db (24 tables) on 2026-04-25.
// Column names/types/defaults mirror the live SQLite schema exactly so that
// `drizzle-kit generate` produces a no-op baseline migration.
// =============================================================================

// Organizations
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  eventName: text('event_name'),
  customDomain: text('custom_domain').unique(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  contactAddress: text('contact_address'),
  contactCity: text('contact_city'),
  contactState: text('contact_state'),
  contactZip: text('contact_zip'),
  passwordHash: text('password_hash'),
  lastLoginAt: text('last_login_at'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  contactEmailIdx: index('organizations_contact_email_idx').on(t.contactEmail),
}));

// Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  emailVerifiedAt: text('email_verified_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Auth.js verification tokens
export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: text('expires').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.identifier, t.token] }),
}));

// Memberships
export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').default('admin').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  userOrgUnique: uniqueIndex('memberships_user_org_unique').on(t.userId, t.organizationId),
}));

// QR Code Sets
export const qrCodeSets = sqliteTable('qr_code_sets', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  language: text('language').default('en').notNull(),
  formFields: text('form_fields').notNull(),
  qrCodes: text('qr_codes').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  scanCount: integer('scan_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  orgIdx: index('qr_code_sets_organization_id_idx').on(t.organizationId),
}));

// Registrations
export const registrations = sqliteTable('registrations', {
  id: text('id').primaryKey(),
  qrCodeSetId: text('qr_code_set_id').notNull().references(() => qrCodeSets.id, { onDelete: 'cascade' }),
  qrCodeId: text('qr_code_id').notNull(),
  registrationData: text('registration_data').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  deliveryStatus: text('delivery_status').default('pending').notNull(),
  deliveredAt: text('delivered_at'),
  registeredAt: text('registered_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  checkInToken: text('check_in_token').unique(),
  checkedInAt: text('checked_in_at'),
  checkedInBy: text('checked_in_by'),
  tokenStatus: text('token_status').default('active').notNull(),
  organizationId: text('organization_id'),
}, (t) => ({
  qrSetIdx: index('registrations_qr_code_set_id_idx').on(t.qrCodeSetId),
  deliveryStatusIdx: index('registrations_delivery_status_idx').on(t.deliveryStatus),
  registeredAtIdx: index('registrations_registered_at_idx').on(t.registeredAt),
  checkInTokenIdx: index('registrations_check_in_token_idx').on(t.checkInToken),
  tokenStatusIdx: index('registrations_token_status_idx').on(t.tokenStatus),
}));

// Verification codes (signup)
export const verificationCodes = sqliteTable('verification_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: text('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
});

// Login codes (passwordless login)
export const loginCodes = sqliteTable('login_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: text('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
}, (t) => ({
  emailIdx: index('login_codes_email_idx').on(t.email),
  expiresAtIdx: index('login_codes_expires_at_idx').on(t.expiresAt),
}));

// Subscription plans
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  planType: text('plan_type').notNull(),
  status: text('status').default('active').notNull(),
  currentPeriodStart: text('current_period_start').notNull(),
  currentPeriodEnd: text('current_period_end').notNull(),
  paymentProvider: text('payment_provider').default('square'),
  externalSubscriptionId: text('external_subscription_id'),
  registrationLimit: integer('registration_limit').notNull(),
  currentRegistrationCount: integer('current_registration_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  billingCycle: text('billing_cycle').default('monthly').notNull(),
  amount: real('amount'),
  currency: text('currency').default('USD').notNull(),
  startDate: text('start_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  endDate: text('end_date'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: text('cancelled_at'),
}, (t) => ({
  orgIdx: index('subscription_plans_organization_id_idx').on(t.organizationId),
  planTypeIdx: index('subscription_plans_plan_type_idx').on(t.planType),
  orgIdx2: index('subscription_plans_org_idx').on(t.organizationId),
  statusIdx: index('subscription_plans_status_idx').on(t.status),
}));

// Payment transactions
export const paymentTransactions = sqliteTable('payment_transactions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  subscriptionPlanId: text('subscription_plan_id').references(() => subscriptionPlans.id),
  squarePaymentId: text('square_payment_id'),
  planType: text('plan_type').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').notNull(),
  paymentProvider: text('payment_provider').default('square').notNull(),
  customerEmail: text('customer_email'),
  couponCode: text('coupon_code'),
  couponDiscount: integer('coupon_discount'),
  receiptUrl: text('receipt_url'),
  failureReason: text('failure_reason'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  orgIdx: index('payment_transactions_organization_id_idx').on(t.organizationId),
  statusIdx: index('payment_transactions_status_idx').on(t.status),
  createdAtIdx: index('payment_transactions_created_at_idx').on(t.createdAt),
}));

// Usage tracking
export const usageTracking = sqliteTable('usage_tracking', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  date: text('date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  registrationCount: integer('registration_count').default(0).notNull(),
  qrCodeScans: integer('qr_code_scans').default(0).notNull(),
  exportCount: integer('export_count').default(0).notNull(),
  searchCount: integer('search_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  orgDateIdx: index('usage_tracking_org_date_idx').on(t.organizationId, t.date),
}));

// Saved searches
export const savedSearches = sqliteTable('saved_searches', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  searchQuery: text('search_query').notNull(),
  filters: text('filters').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  orgIdx: index('saved_searches_organization_id_idx').on(t.organizationId),
}));

// Export jobs
export const exportJobs = sqliteTable('export_jobs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  status: text('status').default('pending').notNull(),
  format: text('format').notNull(),
  fileName: text('file_name').notNull(),
  downloadUrl: text('download_url'),
  totalRecords: integer('total_records').default(0).notNull(),
  processedRecords: integer('processed_records').default(0).notNull(),
  filters: text('filters').notNull(),
  options: text('options').notNull(),
  errorMessage: text('error_message'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: text('completed_at'),
}, (t) => ({
  orgIdx: index('export_jobs_organization_id_idx').on(t.organizationId),
  statusIdx: index('export_jobs_status_idx').on(t.status),
  createdAtIdx: index('export_jobs_created_at_idx').on(t.createdAt),
}));

// Coupon codes (separate from `coupons` legacy table)
export const couponCodes = sqliteTable('coupon_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  discountType: text('discount_type').notNull(),
  discountValue: real('discount_value').notNull(),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  validFrom: text('valid_from').default(sql`CURRENT_TIMESTAMP`).notNull(),
  validUntil: text('valid_until'),
}, (t) => ({
  codeIdx: index('coupon_codes_code_idx').on(t.code),
  isActiveIdx: index('coupon_codes_is_active_idx').on(t.isActive),
}));

// Usage alerts
export const usageAlerts = sqliteTable('usage_alerts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  threshold: integer('threshold').notNull(),
  message: text('message').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  acknowledgedAt: text('acknowledged_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Coupons (legacy global table — managed by ad-hoc scripts; raw-SQL access)
export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(),
  discountValue: real('discount_value').notNull(),
  currency: text('currency').default('USD').notNull(),
  active: integer('active').default(1).notNull(),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').default(0).notNull(),
  expiresAt: text('expires_at'),
  applicablePlans: text('applicable_plans'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdBy: text('created_by'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  codeIdx: index('idx_coupons_code').on(t.code),
  activeIdx: index('idx_coupons_active').on(t.active),
}));

// Coupon redemptions
export const couponRedemptions = sqliteTable('coupon_redemptions', {
  id: text('id').primaryKey(),
  couponId: text('coupon_id').notNull().references(() => coupons.id),
  userId: text('user_id').notNull(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  subscriptionId: text('subscription_id').references(() => subscriptionPlans.id),
  originalAmount: real('original_amount').notNull(),
  discountApplied: real('discount_applied').notNull(),
  finalAmount: real('final_amount').notNull(),
  redeemedAt: text('redeemed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  couponIdx: index('idx_redemptions_coupon').on(t.couponId),
  userIdx: index('idx_redemptions_user').on(t.userId),
}));

// Classes
export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  capacity: integer('capacity').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  orgIdx: index('classes_organization_id_idx').on(t.organizationId),
}));

// Class sessions
export const classSessions = sqliteTable('class_sessions', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  sessionDate: text('session_date').notNull(),
  sessionTime: text('session_time').notNull(),
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  location: text('location'),
  instructorName: text('instructor_name'),
  status: text('status').default('scheduled').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  classIdx: index('class_sessions_class_id_idx').on(t.classId),
}));

// Participants
export const participants = sqliteTable('participants', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  notes: text('notes'),
  status: text('status').default('active').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  orgIdx: index('participants_organization_id_idx').on(t.organizationId),
  emailIdx: index('participants_email_idx').on(t.email),
}));

// Enrollments
export const enrollments = sqliteTable('enrollments', {
  id: text('id').primaryKey(),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => classSessions.id, { onDelete: 'cascade' }),
  enrollmentStatus: text('enrollment_status').default('pending').notNull(),
  enrolledAt: text('enrolled_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  confirmedAt: text('confirmed_at'),
  attendedAt: text('attended_at'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  classIdx: index('enrollments_class_id_idx').on(t.classId),
  participantIdx: index('enrollments_participant_id_idx').on(t.participantId),
  sessionIdx: index('enrollments_session_id_idx').on(t.sessionId),
}));

// Email templates
export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  templateType: text('template_type').notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Email logs
export const emailLogs = sqliteTable('email_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  recipientEmail: text('recipient_email').notNull(),
  templateType: text('template_type').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull(),
  sentAt: text('sent_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  errorMessage: text('error_message'),
  metadata: text('metadata'),
}, (t) => ({
  orgIdx: index('email_logs_organization_id_idx').on(t.organizationId),
  recipientIdx: index('email_logs_recipient_email_idx').on(t.recipientEmail),
}));
