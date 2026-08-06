-- consumed_orders ledger: one paid order id grants at most one org a
-- subscription (create/upgrade/same-plan guard). This table was previously
-- created only at runtime by ensureSubscriptionSchema() in lib/db.ts, so it
-- existed on provisioned DBs but not in the migration chain. IF NOT EXISTS
-- makes this a safe no-op on any DB that already has it (prod/dev/uat), and
-- creates it on a fresh DB so migrations are the single source of truth.
--
-- The unique indexes drizzle-kit also proposed here are intentionally omitted:
-- they are already created by 0002 (subscription_plans_external_subscription_id_uniq)
-- and 0003 (enrollments_class_participant_uniq, uq_redemptions_coupon_org).
-- The regenerated snapshot for this migration captures them so future
-- `drizzle-kit generate` runs stay clean.
CREATE TABLE IF NOT EXISTS `consumed_orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`subscription_id` text,
	`plan_type` text,
	`amount_cents` integer,
	`consumed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `consumed_orders_org_idx` ON `consumed_orders` (`organization_id`);
