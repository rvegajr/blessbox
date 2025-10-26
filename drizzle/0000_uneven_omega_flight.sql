CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text,
	`user_email` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`details` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_organization_id_idx` ON `activities` (`organization_id`);--> statement-breakpoint
CREATE INDEX `activities_user_id_idx` ON `activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `activities_type_idx` ON `activities` (`type`);--> statement-breakpoint
CREATE INDEX `activities_read_idx` ON `activities` (`read`);--> statement-breakpoint
CREATE INDEX `activities_created_at_idx` ON `activities` (`created_at`);--> statement-breakpoint
CREATE TABLE `coupon_uses` (
	`id` text PRIMARY KEY NOT NULL,
	`coupon_code` text NOT NULL,
	`user_email` text NOT NULL,
	`organization_id` text NOT NULL,
	`applied_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`discount_applied` real NOT NULL,
	FOREIGN KEY (`coupon_code`) REFERENCES `coupons`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_email`) REFERENCES `users`(`email`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coupon_uses_coupon_code_idx` ON `coupon_uses` (`coupon_code`);--> statement-breakpoint
CREATE INDEX `coupon_uses_user_email_idx` ON `coupon_uses` (`user_email`);--> statement-breakpoint
CREATE INDEX `coupon_uses_organization_id_idx` ON `coupon_uses` (`organization_id`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`code` text PRIMARY KEY NOT NULL,
	`description` text,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`max_uses` integer,
	`uses_per_user` integer DEFAULT 1 NOT NULL,
	`current_uses` integer DEFAULT 0 NOT NULL,
	`expires_at` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `coupons_code_idx` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_is_active_idx` ON `coupons` (`is_active`);--> statement-breakpoint
CREATE INDEX `coupons_expires_at_idx` ON `coupons` (`expires_at`);--> statement-breakpoint
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
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`fields` text NOT NULL,
	`settings` text NOT NULL,
	`validation` text DEFAULT '[]',
	`conditional_logic` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`submissions_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forms_organization_id_idx` ON `forms` (`organization_id`);--> statement-breakpoint
CREATE INDEX `forms_status_idx` ON `forms` (`status`);--> statement-breakpoint
CREATE INDEX `forms_created_at_idx` ON `forms` (`created_at`);--> statement-breakpoint
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
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`slug` text,
	`billing_status` text DEFAULT 'trial' NOT NULL,
	`monthly_price` real DEFAULT 9.99 NOT NULL,
	`price_override` real,
	`coupon_code` text,
	`coupon_discount` real,
	`subscription_start_date` text,
	`subscription_end_date` text,
	`square_subscription_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_custom_domain_unique` ON `organizations` (`custom_domain`);--> statement-breakpoint
CREATE INDEX `organizations_contact_email_idx` ON `organizations` (`contact_email`);--> statement-breakpoint
CREATE INDEX `organizations_billing_status_idx` ON `organizations` (`billing_status`);--> statement-breakpoint
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
CREATE TABLE `qr_scans` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`qr_code_set_id` text NOT NULL,
	`qr_code_id` text NOT NULL,
	`scanned_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`device_type` text,
	`browser` text,
	`os` text,
	`referrer` text,
	`session_id` text,
	`is_unique` integer DEFAULT true NOT NULL,
	`metadata` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`qr_code_set_id`) REFERENCES `qr_code_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `qr_scans_organization_id_idx` ON `qr_scans` (`organization_id`);--> statement-breakpoint
CREATE INDEX `qr_scans_qr_code_set_id_idx` ON `qr_scans` (`qr_code_set_id`);--> statement-breakpoint
CREATE INDEX `qr_scans_qr_code_id_idx` ON `qr_scans` (`qr_code_id`);--> statement-breakpoint
CREATE INDEX `qr_scans_scanned_at_idx` ON `qr_scans` (`scanned_at`);--> statement-breakpoint
CREATE INDEX `qr_scans_is_unique_idx` ON `qr_scans` (`is_unique`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
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
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`qr_code_set_id`) REFERENCES `qr_code_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_check_in_token_unique` ON `registrations` (`check_in_token`);--> statement-breakpoint
CREATE INDEX `registrations_organization_id_idx` ON `registrations` (`organization_id`);--> statement-breakpoint
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
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscription_plans_organization_id_idx` ON `subscription_plans` (`organization_id`);--> statement-breakpoint
CREATE INDEX `subscription_plans_plan_type_idx` ON `subscription_plans` (`plan_type`);--> statement-breakpoint
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
CREATE TABLE `user_organizations` (
	`user_email` text NOT NULL,
	`organization_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_email`) REFERENCES `users`(`email`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_organizations_user_email_idx` ON `user_organizations` (`user_email`);--> statement-breakpoint
CREATE INDEX `user_organizations_organization_id_idx` ON `user_organizations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `user_organizations_primary_key` ON `user_organizations` (`user_email`,`organization_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text,
	`phone` text,
	`square_customer_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
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
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text
);
--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `accounts_provider_idx` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `nextauth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer,
	`image` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nextauth_users_email_unique` ON `nextauth_users` (`email`);--> statement-breakpoint
CREATE INDEX `nextauth_users_email_idx` ON `nextauth_users` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `sessions_session_token_idx` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_tokens_identifier_token_idx` ON `verification_tokens` (`identifier`,`token`);