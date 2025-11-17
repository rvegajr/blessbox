CREATE TABLE "coupon_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"format" varchar(10) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"download_url" text,
	"total_records" integer DEFAULT 0 NOT NULL,
	"processed_records" integer DEFAULT 0 NOT NULL,
	"filters" jsonb NOT NULL,
	"options" jsonb NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_plan_id" uuid,
	"square_payment_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" varchar(20) NOT NULL,
	"payment_method" varchar(50),
	"transaction_type" varchar(20) NOT NULL,
	"metadata" jsonb,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"search_query" jsonb NOT NULL,
	"filters" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"registration_limit" integer NOT NULL,
	"current_registration_count" integer DEFAULT 0 NOT NULL,
	"billing_cycle" varchar(20) DEFAULT 'monthly' NOT NULL,
	"amount" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"threshold" integer NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"registration_count" integer DEFAULT 0 NOT NULL,
	"qr_code_scans" integer DEFAULT 0 NOT NULL,
	"export_count" integer DEFAULT 0 NOT NULL,
	"search_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "delivery_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_alerts" ADD CONSTRAINT "usage_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupon_codes_code_idx" ON "coupon_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_codes_is_active_idx" ON "coupon_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "export_jobs_organization_id_idx" ON "export_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "export_jobs_status_idx" ON "export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "export_jobs_created_at_idx" ON "export_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_transactions_organization_id_idx" ON "payment_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "saved_searches_organization_id_idx" ON "saved_searches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscription_plans_organization_id_idx" ON "subscription_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscription_plans_plan_type_idx" ON "subscription_plans" USING btree ("plan_type");--> statement-breakpoint
CREATE INDEX "usage_alerts_organization_id_idx" ON "usage_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "usage_alerts_is_active_idx" ON "usage_alerts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "usage_tracking_org_date_idx" ON "usage_tracking" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "registrations_qr_code_set_id_idx" ON "registrations" USING btree ("qr_code_set_id");--> statement-breakpoint
CREATE INDEX "registrations_delivery_status_idx" ON "registrations" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "registrations_registered_at_idx" ON "registrations" USING btree ("registered_at");