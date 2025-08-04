CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_name" varchar(255),
	"custom_domain" varchar(255),
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"contact_address" text,
	"contact_city" varchar(100),
	"contact_state" varchar(50),
	"contact_zip" varchar(20),
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_custom_domain_unique" UNIQUE("custom_domain"),
	CONSTRAINT "organizations_contact_email_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE "qr_code_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"form_fields" jsonb NOT NULL,
	"qr_codes" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_code_set_id" uuid NOT NULL,
	"qr_code_id" varchar(255) NOT NULL,
	"registration_data" jsonb NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qr_code_sets" ADD CONSTRAINT "qr_code_sets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_qr_code_set_id_qr_code_sets_id_fk" FOREIGN KEY ("qr_code_set_id") REFERENCES "public"."qr_code_sets"("id") ON DELETE cascade ON UPDATE no action;