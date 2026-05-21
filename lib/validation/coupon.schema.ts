/**
 * Zod validation schemas for coupon operations
 * Part of P0 coupon fixes
 */
import { z } from 'zod';

// Relaxed regex: alphanumeric + hyphens + underscores
const COUPON_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

export const createCouponSchema = z.object({
  code: z.string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must be at most 50 characters')
    .regex(COUPON_CODE_REGEX, 'Coupon code can only contain letters, numbers, hyphens, and underscores')
    .transform(val => val.toUpperCase().trim()),
  
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .default(''),
  
  discountType: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'Discount type must be either "percentage" or "fixed"' })
  }),
  
  discountValue: z.number()
    .positive('Discount value must be greater than 0'),
  
  minAmount: z.number()
    .int('Minimum amount must be an integer')
    .nonnegative('Minimum amount cannot be negative')
    .optional()
    .nullable()
    .default(null),
  
  maxDiscount: z.number()
    .int('Maximum discount must be an integer')
    .positive('Maximum discount must be greater than 0')
    .optional()
    .nullable()
    .default(null),
  
  maxRedemptions: z.number()
    .int('Maximum redemptions must be an integer')
    .positive('Maximum redemptions must be greater than 0')
    .optional()
    .nullable()
    .default(null),
  
  expiresAt: z.string()
    .datetime({ message: 'Expires at must be a valid ISO datetime' })
    .optional()
    .nullable()
    .default(null),
  
  applicablePlans: z.array(z.string())
    .optional()
    .nullable()
    .default(null),
  
  isActive: z.boolean()
    .optional()
    .default(true)
}).superRefine((data, ctx) => {
  // Cross-field validation: percentage discounts must be <= 100
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Percentage discount must be between 0 and 100'
    });
  }
});

export const updateCouponSchema = z.object({
  description: z.string().max(500).optional(),
  discountValue: z.number().positive().optional(),
  minAmount: z.number().int().nonnegative().optional().nullable(),
  maxDiscount: z.number().int().positive().optional().nullable(),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  applicablePlans: z.array(z.string()).optional().nullable(),
  isActive: z.boolean().optional()
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
