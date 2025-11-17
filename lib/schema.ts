import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Organizations table
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  eventName: text('event_name'),
  customDomain: text('custom_domain').unique(),
  contactEmail: text('contact_email').notNull().unique(),
  contactPhone: text('contact_phone'),
  contactAddress: text('contact_address'),
  contactCity: text('contact_city'),
  contactState: text('contact_state'),
  contactZip: text('contact_zip'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// QR Code Sets table
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
});

// Registrations table
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
});

// Verification Codes table
export const verificationCodes = sqliteTable('verification_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: text('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
});

// Subscription Plans table
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  planType: text('plan_type').notNull(),
  status: text('status').default('active').notNull(),
  registrationLimit: integer('registration_limit').notNull(),
  currentRegistrationCount: integer('current_registration_count').default(0).notNull(),
  billingCycle: text('billing_cycle').default('monthly').notNull(),
  amount: real('amount'),
  currency: text('currency').default('USD').notNull(),
  startDate: text('start_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  endDate: text('end_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Classes table
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
});

// Class Sessions table
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
});

// Participants table
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
});

// Enrollments table
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
});

// Email Templates table
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

// Email Logs table
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
});

// Coupons table
export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description').notNull().default(''),
  discountType: text('discount_type', { enum: ['percentage', 'fixed'] }).notNull(),
  discountValue: real('discount_value').notNull(),
  minAmount: integer('min_amount').default(0).notNull(), // Minimum order amount in cents
  maxDiscount: integer('max_discount'), // Maximum discount amount in cents (for percentage discounts)
  maxRedemptions: integer('max_redemptions'), // Maximum number of times this coupon can be used
  expiresAt: text('expires_at'), // ISO date string
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  applicablePlans: text('applicable_plans'), // JSON array of plan types this coupon applies to
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Coupon Redemptions table
export const couponRedemptions = sqliteTable('coupon_redemptions', {
  id: text('id').primaryKey(),
  couponId: text('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  discountAmount: integer('discount_amount').notNull(), // Actual discount applied in cents
  orderId: text('order_id'), // Reference to the order/transaction
  redeemedAt: text('redeemed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
