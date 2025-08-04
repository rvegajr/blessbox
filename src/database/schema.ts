// Database schema using Drizzle ORM - NOW WITH SQLITE POWER! 🚀
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Organizations table - SQLITE POWERED! ⚡
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  eventName: text('event_name'),
  customDomain: text('custom_domain').unique(),
  contactEmail: text('contact_email').notNull().unique(),
  contactPhone: text('contact_phone'),
  contactAddress: text('contact_address'),
  contactCity: text('contact_city'),
  contactState: text('contact_state'),
  contactZip: text('contact_zip'),
  passwordHash: text('password_hash'), // 🎉 NULLABLE for passwordless magic!
  lastLoginAt: text('last_login_at'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// QR Code Sets table - EDGE OPTIMIZED! 🌟
export const qrCodeSets = sqliteTable('qr_code_sets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  language: text('language').default('en').notNull(),
  formFields: text('form_fields', { mode: 'json' }).notNull(), // JSON as text - SQLITE STYLE!
  qrCodes: text('qr_codes', { mode: 'json' }).notNull(), // JSON as text - PERFECT!
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  scanCount: integer('scan_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Registrations table - DASHBOARD READY! 📊
export const registrations = sqliteTable('registrations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qrCodeSetId: text('qr_code_set_id').notNull().references(() => qrCodeSets.id, { onDelete: 'cascade' }),
  qrCodeId: text('qr_code_id').notNull(), // Which specific QR code was scanned
  registrationData: text('registration_data', { mode: 'json' }).notNull(), // Form field values as JSON
  ipAddress: text('ip_address'), // IPv6 support
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  deliveryStatus: text('delivery_status').default('pending').notNull(), // pending, delivered, failed
  deliveredAt: text('delivered_at'),
  registeredAt: text('registered_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // 🎉 CHECK-IN MAGIC FIELDS - THE FUTURE IS HERE! ✨
  checkInToken: text('check_in_token').unique(), // UUID token for QR code scanning
  checkedInAt: text('checked_in_at'), // When they were checked in
  checkedInBy: text('checked_in_by'), // Organization worker who scanned
  tokenStatus: text('token_status').default('active').notNull(), // active, used, expired
}, (table) => ({
  // Indexes for LIGHTNING FAST dashboard queries! ⚡
  qrCodeSetIdIdx: index('registrations_qr_code_set_id_idx').on(table.qrCodeSetId),
  deliveryStatusIdx: index('registrations_delivery_status_idx').on(table.deliveryStatus),
  registeredAtIdx: index('registrations_registered_at_idx').on(table.registeredAt),
  // 🚀 CHECK-IN PERFORMANCE INDEXES - SPEED OF LIGHT! ⚡
  checkInTokenIdx: index('registrations_check_in_token_idx').on(table.checkInToken),
  tokenStatusIdx: index('registrations_token_status_idx').on(table.tokenStatus),
}));

// Verification codes table - EMAIL SECURITY! 🔐
export const verificationCodes = sqliteTable('verification_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  code: text('code').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: text('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
});

// Login codes table - PASSWORDLESS MAGIC! ✨🔐
export const loginCodes = sqliteTable('login_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  code: text('code').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: text('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
}, (table) => ({
  emailIdx: index('login_codes_email_idx').on(table.email),
  expiresAtIdx: index('login_codes_expires_at_idx').on(table.expiresAt),
}));

// Relations will be defined after all tables are created

// Subscription Plans table - BILLING POWER! 💰
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  planType: text('plan_type').notNull(), // free, standard, enterprise
  status: text('status').default('active').notNull(), // active, cancelled, suspended, past_due
  currentPeriodStart: text('current_period_start').notNull(),
  currentPeriodEnd: text('current_period_end').notNull(),
  paymentProvider: text('payment_provider').default('square'),
  externalSubscriptionId: text('external_subscription_id'), // Square payment ID or subscription ID
  registrationLimit: integer('registration_limit').notNull(),
  currentRegistrationCount: integer('current_registration_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  organizationIdIdx: index('subscription_plans_organization_id_idx').on(table.organizationId),
  planTypeIdx: index('subscription_plans_plan_type_idx').on(table.planType),
}));

// Payment Transactions table - SQUARE READY! 💳
export const paymentTransactions = sqliteTable('payment_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  subscriptionPlanId: text('subscription_plan_id').references(() => subscriptionPlans.id),
  squarePaymentId: text('square_payment_id'),
  planType: text('plan_type').notNull(), // standard, enterprise
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').default('USD').notNull(),
  status: text('status').notNull(), // pending, completed, failed, refunded
  paymentProvider: text('payment_provider').default('square').notNull(),
  customerEmail: text('customer_email'),
  couponCode: text('coupon_code'),
  couponDiscount: integer('coupon_discount'), // Discount amount in cents
  receiptUrl: text('receipt_url'),
  failureReason: text('failure_reason'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  organizationIdIdx: index('payment_transactions_organization_id_idx').on(table.organizationId),
  statusIdx: index('payment_transactions_status_idx').on(table.status),
  createdAtIdx: index('payment_transactions_created_at_idx').on(table.createdAt),
}));

// Usage Tracking table - ANALYTICS POWER! 📊
export const usageTracking = sqliteTable('usage_tracking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  date: text('date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  registrationCount: integer('registration_count').default(0).notNull(),
  qrCodeScans: integer('qr_code_scans').default(0).notNull(),
  exportCount: integer('export_count').default(0).notNull(),
  searchCount: integer('search_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  organizationIdDateIdx: index('usage_tracking_org_date_idx').on(table.organizationId, table.date),
}));

// Saved Searches table - SEARCH MASTERY! 🔍
export const savedSearches = sqliteTable('saved_searches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  searchQuery: text('search_query', { mode: 'json' }).notNull(), // SearchQuery object as JSON
  filters: text('filters', { mode: 'json' }).notNull(), // SearchFilters object as JSON
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  organizationIdIdx: index('saved_searches_organization_id_idx').on(table.organizationId),
}));

// Export Jobs table - EXCEL EXPORT MAGIC! 📊
export const exportJobs = sqliteTable('export_jobs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  status: text('status').default('pending').notNull(), // pending, processing, completed, failed
  format: text('format').notNull(), // excel, csv, pdf
  fileName: text('file_name').notNull(),
  downloadUrl: text('download_url'),
  totalRecords: integer('total_records').default(0).notNull(),
  processedRecords: integer('processed_records').default(0).notNull(),
  filters: text('filters', { mode: 'json' }).notNull(), // Export filters as JSON
  options: text('options', { mode: 'json' }).notNull(), // Export options as JSON
  errorMessage: text('error_message'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: text('completed_at'),
}, (table) => ({
  organizationIdIdx: index('export_jobs_organization_id_idx').on(table.organizationId),
  statusIdx: index('export_jobs_status_idx').on(table.status),
  createdAtIdx: index('export_jobs_created_at_idx').on(table.createdAt),
}));

// Coupon Codes table - DISCOUNT POWER! 💸
export const couponCodes = sqliteTable('coupon_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  discountType: text('discount_type').notNull(), // percentage, fixed_amount
  discountValue: real('discount_value').notNull(),
  usageLimit: integer('usage_limit'), // null = unlimited
  usageCount: integer('usage_count').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  validFrom: text('valid_from').default(sql`CURRENT_TIMESTAMP`).notNull(),
  validUntil: text('valid_until'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  codeIdx: index('coupon_codes_code_idx').on(table.code),
  isActiveIdx: index('coupon_codes_is_active_idx').on(table.isActive),
}));

// Usage Alerts table - SMART NOTIFICATIONS! 🔔
export const usageAlerts = sqliteTable('usage_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // limit_warning, limit_reached, plan_upgrade_suggested
  threshold: integer('threshold').notNull(), // Percentage that triggered alert
  message: text('message').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  acknowledgedAt: text('acknowledged_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  organizationIdIdx: index('usage_alerts_organization_id_idx').on(table.organizationId),
  isActiveIdx: index('usage_alerts_is_active_idx').on(table.isActive),
}));

// Relations
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  qrCodeSets: many(qrCodeSets),
  registrations: many(registrations),
  subscriptionPlan: one(subscriptionPlans),
  paymentTransactions: many(paymentTransactions),
  usageTracking: many(usageTracking),
  savedSearches: many(savedSearches),
  exportJobs: many(exportJobs),
  usageAlerts: many(usageAlerts),
}));

export const qrCodeSetsRelations = relations(qrCodeSets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [qrCodeSets.organizationId],
    references: [organizations.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  qrCodeSet: one(qrCodeSets, {
    fields: [registrations.qrCodeSetId],
    references: [qrCodeSets.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [subscriptionPlans.organizationId],
    references: [organizations.id],
  }),
  paymentTransactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  organization: one(organizations, {
    fields: [paymentTransactions.organizationId],
    references: [organizations.id],
  }),
  subscriptionPlan: one(subscriptionPlans, {
    fields: [paymentTransactions.subscriptionPlanId],
    references: [subscriptionPlans.id],
  }),
}));

// Export types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type QRCodeSet = typeof qrCodeSets.$inferSelect;
export type NewQRCodeSet = typeof qrCodeSets.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type ExportJob = typeof exportJobs.$inferSelect;
export type NewExportJob = typeof exportJobs.$inferInsert;
export type CouponCode = typeof couponCodes.$inferSelect;
export type NewCouponCode = typeof couponCodes.$inferInsert;
export type UsageAlert = typeof usageAlerts.$inferSelect;
export type NewUsageAlert = typeof usageAlerts.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;