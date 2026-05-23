-- Migration: Add missing fields to coupons table
-- Date: 2026-05-22
-- Issue: #29 - Admin coupon management

-- Add description column (allows null for existing records)
ALTER TABLE `coupons` ADD COLUMN `description` text;

-- Add min_amount column for minimum purchase requirement
ALTER TABLE `coupons` ADD COLUMN `min_amount` integer;

-- Add max_discount column for percentage coupons
ALTER TABLE `coupons` ADD COLUMN `max_discount` integer;
