DELETE FROM enrollments WHERE rowid NOT IN (SELECT MIN(rowid) FROM enrollments GROUP BY class_id, participant_id);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `enrollments_class_participant_uniq` ON `enrollments` (`class_id`, `participant_id`);--> statement-breakpoint
DELETE FROM coupon_redemptions WHERE rowid NOT IN (SELECT MIN(rowid) FROM coupon_redemptions GROUP BY coupon_id, organization_id);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_redemptions_coupon_org` ON `coupon_redemptions` (`coupon_id`, `organization_id`);
