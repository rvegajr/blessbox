CREATE TABLE `class_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`session_date` text NOT NULL,
	`session_time` text NOT NULL,
	`duration_minutes` integer DEFAULT 60 NOT NULL,
	`location` text,
	`instructor_name` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `class_sessions_class_id_idx` ON `class_sessions` (`class_id`);--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`capacity` integer NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classes_organization_id_idx` ON `classes` (`organization_id`);--> statement-breakpoint
CREATE TABLE `coupon_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`valid_from` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`valid_until` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_codes_code_unique` ON `coupon_codes` (`code`);--> statement-breakpoint
CREATE INDEX `coupon_codes_code_idx` ON `coupon_codes` (`code`);--> statement-breakpoint
CREATE INDEX `coupon_codes_is_active_idx` ON `coupon_codes` (`is_active`);--> statement-breakpoint
CREATE TABLE `coupon_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`coupon_id` text NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`subscription_id` text,
	`original_amount` real NOT NULL,
	`discount_applied` real NOT NULL,
	`final_amount` real NOT NULL,
	`redeemed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_redemptions_coupon` ON `coupon_redemptions` (`coupon_id`);--> statement-breakpoint
CREATE INDEX `idx_redemptions_user` ON `coupon_redemptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`max_uses` integer,
	`current_uses` integer DEFAULT 0 NOT NULL,
	`expires_at` text,
	`applicable_plans` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_by` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `idx_coupons_code` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `idx_coupons_active` ON `coupons` (`active`);--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`recipient_email` text NOT NULL,
	`template_type` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`sent_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`error_message` text,
	`metadata` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_logs_organization_id_idx` ON `email_logs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `email_logs_recipient_email_idx` ON `email_logs` (`recipient_email`);--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`template_type` text NOT NULL,
	`subject` text NOT NULL,
	`html_content` text NOT NULL,
	`text_content` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`class_id` text NOT NULL,
	`session_id` text,
	`enrollment_status` text DEFAULT 'pending' NOT NULL,
	`enrolled_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`confirmed_at` text,
	`attended_at` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `enrollments_class_id_idx` ON `enrollments` (`class_id`);--> statement-breakpoint
CREATE INDEX `enrollments_participant_id_idx` ON `enrollments` (`participant_id`);--> statement-breakpoint
CREATE INDEX `enrollments_session_id_idx` ON `enrollments` (`session_id`);--> statement-breakpoint
CREATE TABLE `export_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`format` text NOT NULL,
	`file_name` text NOT NULL,
	`download_url` text,
	`total_records` integer DEFAULT 0 NOT NULL,
	`processed_records` integer DEFAULT 0 NOT NULL,
	`filters` text NOT NULL,
	`options` text NOT NULL,
	`error_message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `export_jobs_organization_id_idx` ON `export_jobs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `export_jobs_status_idx` ON `export_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `export_jobs_created_at_idx` ON `export_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `login_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_codes_email_idx` ON `login_codes` (`email`);--> statement-breakpoint
CREATE INDEX `login_codes_expires_at_idx` ON `login_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_user_org_unique` ON `memberships` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`event_name` text,
	`custom_domain` text,
	`contact_email` text NOT NULL,
	`contact_phone` text,
	`contact_address` text,
	`contact_city` text,
	`contact_state` text,
	`contact_zip` text,
	`password_hash` text,
	`last_login_at` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_custom_domain_unique` ON `organizations` (`custom_domain`);--> statement-breakpoint
CREATE INDEX `organizations_contact_email_idx` ON `organizations` (`contact_email`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`emergency_contact` text,
	`emergency_phone` text,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `participants_organization_id_idx` ON `participants` (`organization_id`);--> statement-breakpoint
CREATE INDEX `participants_email_idx` ON `participants` (`email`);--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`subscription_plan_id` text,
	`square_payment_id` text,
	`plan_type` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text NOT NULL,
	`payment_provider` text DEFAULT 'square' NOT NULL,
	`customer_email` text,
	`coupon_code` text,
	`coupon_discount` integer,
	`receipt_url` text,
	`failure_reason` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_transactions_organization_id_idx` ON `payment_transactions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `payment_transactions_status_idx` ON `payment_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `payment_transactions_created_at_idx` ON `payment_transactions` (`created_at`);--> statement-breakpoint
CREATE TABLE `qr_code_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`form_fields` text NOT NULL,
	`qr_codes` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`scan_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `qr_code_sets_organization_id_idx` ON `qr_code_sets` (`organization_id`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`qr_code_set_id` text NOT NULL,
	`qr_code_id` text NOT NULL,
	`registration_data` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`referrer` text,
	`delivery_status` text DEFAULT 'pending' NOT NULL,
	`delivered_at` text,
	`registered_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`check_in_token` text,
	`checked_in_at` text,
	`checked_in_by` text,
	`token_status` text DEFAULT 'active' NOT NULL,
	`organization_id` text,
	FOREIGN KEY (`qr_code_set_id`) REFERENCES `qr_code_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_check_in_token_unique` ON `registrations` (`check_in_token`);--> statement-breakpoint
CREATE INDEX `registrations_qr_code_set_id_idx` ON `registrations` (`qr_code_set_id`);--> statement-breakpoint
CREATE INDEX `registrations_delivery_status_idx` ON `registrations` (`delivery_status`);--> statement-breakpoint
CREATE INDEX `registrations_registered_at_idx` ON `registrations` (`registered_at`);--> statement-breakpoint
CREATE INDEX `registrations_check_in_token_idx` ON `registrations` (`check_in_token`);--> statement-breakpoint
CREATE INDEX `registrations_token_status_idx` ON `registrations` (`token_status`);--> statement-breakpoint
CREATE TABLE `saved_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`search_query` text NOT NULL,
	`filters` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_searches_organization_id_idx` ON `saved_searches` (`organization_id`);--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`plan_type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_start` text NOT NULL,
	`current_period_end` text NOT NULL,
	`payment_provider` text DEFAULT 'square',
	`external_subscription_id` text,
	`registration_limit` integer NOT NULL,
	`current_registration_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`billing_cycle` text DEFAULT 'monthly' NOT NULL,
	`amount` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`start_date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`end_date` text,
	`cancellation_reason` text,
	`cancelled_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscription_plans_organization_id_idx` ON `subscription_plans` (`organization_id`);--> statement-breakpoint
CREATE INDEX `subscription_plans_plan_type_idx` ON `subscription_plans` (`plan_type`);--> statement-breakpoint
CREATE INDEX `subscription_plans_org_idx` ON `subscription_plans` (`organization_id`);--> statement-breakpoint
CREATE INDEX `subscription_plans_status_idx` ON `subscription_plans` (`status`);--> statement-breakpoint
CREATE TABLE `usage_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`threshold` integer NOT NULL,
	`message` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`acknowledged_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`registration_count` integer DEFAULT 0 NOT NULL,
	`qr_code_scans` integer DEFAULT 0 NOT NULL,
	`export_count` integer DEFAULT 0 NOT NULL,
	`search_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `usage_tracking_org_date_idx` ON `usage_tracking` (`organization_id`,`date`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`image` text,
	`email_verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
