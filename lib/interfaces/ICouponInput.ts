// lib/interfaces/ICouponInput.ts
export interface CouponResult {
  code: string;
  discount: number;
  finalAmount: number;
}

export interface CouponInputProps {
  onCouponApplied: (result: CouponResult) => void;
  onCouponRemoved: () => void;
  onError: (error: string) => void;
  planType: string;
  amount: number;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  'data-testid'?: string;
}
