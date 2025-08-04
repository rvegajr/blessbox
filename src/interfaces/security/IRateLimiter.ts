// Interface Segregation Principle: Rate limiting service
export interface IRateLimiter {
  // Check if request is allowed
  checkLimit(identifier: string, endpoint: string): Promise<RateLimitResult>;
  
  // Reset limits for identifier
  resetLimits(identifier: string, endpoint?: string): Promise<void>;
  
  // Get current limit status
  getLimitStatus(identifier: string, endpoint: string): Promise<RateLimitStatus>;
  
  // Configure limits for specific endpoints
  configureLimits(endpoint: string, config: RateLimitConfig): void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds to wait if blocked
}

export interface RateLimitStatus {
  requests: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after limit exceeded
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}