// Database schema using Drizzle ORM - NOW WITH SQLITE POWER! 🚀
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users table - EMAIL AS PRIMARY IDENTIFIER! 🎯
export const users = sqliteTable('users', {
  email: text('email').primaryKey(), // Using email as identifier as requested
  name: text('name'),
  phone: text('phone'),
  squareCustomerId: text('square_customer_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastLoginAt: text('last_login_at'),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// Organizations table - SQLITE POWERED! ⚡
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  eventName: text('event_name'),
  customDomain: text('custom_domain').unique(),
  contactEmail: text('contact_email').notNull(), // REMOVED UNIQUE constraint
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
  slug: text('slug'), // 🎯 Slug field - EXACTLY matches database position 15
  // NEW FIELDS FOR MULTI-ORG & BILLING
  billingStatus: text('billing_status').default('trial').notNull(), // trial/active/suspended/cancelled
  monthlyPrice: real('monthly_price').default(9.99).notNull(),
  priceOverride: real('price_override'), // Admin can set custom price
  couponCode: text('coupon_code'), // Applied coupon
  couponDiscount: real('coupon_discount'), // Discount amount
  subscriptionStartDate: text('subscription_start_date'),
  subscriptionEndDate: text('subscription_end_date'),
  squareSubscriptionId: text('square_subscription_id'),
}, (table) => ({
  contactEmailIdx: index('organizations_contact_email_idx').on(table.contactEmail),
  billingStatusIdx: index('organizations_billing_status_idx').on(table.billingStatus),
}));

// User Organizations junction table - MULTI-ORG SUPPORT! 🏢
export const userOrganizations = sqliteTable('user_organizations', {
  userEmail: text('user_email').notNull().references(() => users.email, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').default('owner').notNull(), // owner/admin/member
  joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userEmailIdx: index('user_organizations_user_email_idx').on(table.userEmail),
  organizationIdIdx: index('user_organizations_organization_id_idx').on(table.organizationId),
  primaryKey: index('user_organizations_primary_key').on(table.userEmail, table.organizationId),
}));

// Enhanced Coupons table - MULTIPLE USES SUPPORT! 💸
export const coupons = sqliteTable('coupons', {
  code: text('code').primaryKey(), // Uppercase, unique
  description: text('description'),
  discountType: text('discount_type').notNull(), // percentage/fixed_amount
  discountValue: real('discount_value').notNull(),
  maxUses: integer('max_uses'), // NULL = unlimited
  usesPerUser: integer('uses_per_user').default(1).notNull(), // How many times one user can use
  currentUses: integer('current_uses').default(0).notNull(),
  expiresAt: text('expires_at'),
  createdBy: text('created_by').notNull(), // Admin email
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(), // Soft delete
}, (table) => ({
  codeIdx: index('coupons_code_idx').on(table.code),
  isActiveIdx: index('coupons_is_active_idx').on(table.isActive),
  expiresAtIdx: index('coupons_expires_at_idx').on(table.expiresAt),
}));

// Coupon Uses tracking table - USAGE ANALYTICS! 📊
export const couponUses = sqliteTable('coupon_uses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  couponCode: text('coupon_code').notNull().references(() => coupons.code, { onDelete: 'cascade' }),
  userEmail: text('user_email').notNull().references(() => users.email, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  appliedAt: text('applied_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  discountApplied: real('discount_applied').notNull(),
}, (table) => ({
  couponCodeIdx: index('coupon_uses_coupon_code_idx').on(table.couponCode),
  userEmailIdx: index('coupon_uses_user_email_idx').on(table.userEmail),
  organizationIdIdx: index('coupon_uses_organization_id_idx').on(table.organizationId),
}));

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

// QR Scans table - INDIVIDUAL SCAN TRACKING! 📱
export const qrScans = sqliteTable('qr_scans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  qrCodeSetId: text('qr_code_set_id').notNull().references(() => qrCodeSets.id, { onDelete: 'cascade' }),
  qrCodeId: text('qr_code_id').notNull(), // Which specific QR code was scanned
  scannedAt: text('scanned_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'), // mobile, desktop, tablet
  browser: text('browser'),
  os: text('os'),
  referrer: text('referrer'),
  sessionId: text('session_id'),
  isUnique: integer('is_unique', { mode: 'boolean' }).default(true).notNull(),
  metadata: text('metadata', { mode: 'json' }), // Additional scan data
}, (table) => ({
  organizationIdIdx: index('qr_scans_organization_id_idx').on(table.organizationId),
  qrCodeSetIdIdx: index('qr_scans_qr_code_set_id_idx').on(table.qrCodeSetId),
  qrCodeIdIdx: index('qr_scans_qr_code_id_idx').on(table.qrCodeId),
  scannedAtIdx: index('qr_scans_scanned_at_idx').on(table.scannedAt),
  isUniqueIdx: index('qr_scans_is_unique_idx').on(table.isUnique),
}));

// Forms table - FORM BUILDER READY! 📝
export const forms = sqliteTable('forms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  fields: text('fields', { mode: 'json' }).notNull(), // FormField[] as JSON
  settings: text('settings', { mode: 'json' }).notNull(), // FormSettings as JSON
  validation: text('validation', { mode: 'json' }).default('[]'), // FormValidation as JSON
  conditionalLogic: text('conditional_logic', { mode: 'json' }).default('[]'), // ConditionalLogic[] as JSON
  status: text('status').default('draft').notNull(), // draft, published, archived
  version: integer('version').default(1).notNull(),
  submissionsCount: integer('submissions_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  publishedAt: text('published_at'),
}, (table) => ({
  organizationIdIdx: index('forms_organization_id_idx').on(table.organizationId),
  statusIdx: index('forms_status_idx').on(table.status),
  createdAtIdx: index('forms_created_at_idx').on(table.createdAt),
}));

// Activities table - SYSTEM ACTIVITY TRACKING! 📋
export const activities = sqliteTable('activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id'), // Optional - can be system activity
  userEmail: text('user_email'),
  type: text('type').notNull(), // registration, qr_scan, form_edit, user_action, system
  title: text('title').notNull(),
  description: text('description'),
  details: text('details', { mode: 'json' }), // Additional activity data as JSON
  read: integer('read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  organizationIdIdx: index('activities_organization_id_idx').on(table.organizationId),
  userIdIdx: index('activities_user_id_idx').on(table.userId),
  typeIdx: index('activities_type_idx').on(table.type),
  readIdx: index('activities_read_idx').on(table.read),
  createdAtIdx: index('activities_created_at_idx').on(table.createdAt),
}));

// Registrations table - DASHBOARD READY! 📊
export const registrations = sqliteTable('registrations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
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
  organizationIdIdx: index('registrations_organization_id_idx').on(table.organizationId),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  couponUses: many(couponUses),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  userOrganizations: many(userOrganizations),
  qrCodeSets: many(qrCodeSets),
  qrScans: many(qrScans),
  forms: many(forms),
  activities: many(activities),
  registrations: many(registrations),
  subscriptionPlan: one(subscriptionPlans),
  paymentTransactions: many(paymentTransactions),
  usageTracking: many(usageTracking),
  savedSearches: many(savedSearches),
  exportJobs: many(exportJobs),
  couponUses: many(couponUses),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userEmail],
    references: [users.email],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  couponUses: many(couponUses),
}));

export const couponUsesRelations = relations(couponUses, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUses.couponCode],
    references: [coupons.code],
  }),
  user: one(users, {
    fields: [couponUses.userEmail],
    references: [users.email],
  }),
  organization: one(organizations, {
    fields: [couponUses.organizationId],
    references: [organizations.id],
  }),
}));

export const qrCodeSetsRelations = relations(qrCodeSets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [qrCodeSets.organizationId],
    references: [organizations.id],
  }),
  registrations: many(registrations),
  qrScans: many(qrScans),
}));

export const qrScansRelations = relations(qrScans, ({ one }) => ({
  organization: one(organizations, {
    fields: [qrScans.organizationId],
    references: [organizations.id],
  }),
  qrCodeSet: one(qrCodeSets, {
    fields: [qrScans.qrCodeSetId],
    references: [qrCodeSets.id],
  }),
}));

export const formsRelations = relations(forms, ({ one }) => ({
  organization: one(organizations, {
    fields: [forms.organizationId],
    references: [organizations.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, {
    fields: [activities.organizationId],
    references: [organizations.id],
  }),
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

// Import NextAuth tables
export * from './nextauth-schema';

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type NewUserOrganization = typeof userOrganizations.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponUse = typeof couponUses.$inferSelect;
export type NewCouponUse = typeof couponUses.$inferInsert;
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
export type CouponCode = typeof coupons.$inferSelect;
export type NewCouponCode = typeof coupons.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type QRScan = typeof qrScans.$inferSelect;
export type NewQRScan = typeof qrScans.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

