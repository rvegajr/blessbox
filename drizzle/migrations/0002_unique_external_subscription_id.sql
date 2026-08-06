CREATE UNIQUE INDEX `subscription_plans_external_subscription_id_uniq` ON `subscription_plans` (`external_subscription_id`) WHERE `external_subscription_id` IS NOT NULL;
