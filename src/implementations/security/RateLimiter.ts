// TDD Implementation: Rate Limiter Service
import type { 
  IRateLimiter, 
  RateLimitResult, 
  RateLimitStatus, 
  RateLimitConfig 
} from '../../interfaces/security/IRateLimiter';

interface LimitEntry {
  requests: number;
  resetTime: Date;
  blocked: boolean;
  blockUntil?: Date;
}

export class RateLimiter implements IRateLimiter {
  private limits = new Map<string, LimitEntry>();
  private configs = new Map<string, RateLimitConfig>();

  // Default configuration
  private defaultConfig: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  };

  async checkLimit(identifier: string, endpoint: string): Promise<RateLimitResult> {
    const config = this.configs.get(endpoint) || this.defaultConfig;
    const key = `${identifier}:${endpoint}`;
    const now = new Date();
    
    let entry = this.limits.get(key);
    
    // Initialize or reset if window expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        requests: 0,
        resetTime: new Date(now.getTime() + config.windowMs),
        blocked: false,
      };
    }

    // Check if still blocked from previous violation
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockUntil.getTime() - now.getTime()) / 1000),
      };
    }

    // Clear block if block period expired
    if (entry.blocked && entry.blockUntil && now >= entry.blockUntil) {
      entry.blocked = false;
      entry.blockUntil = undefined;
      entry.requests = 0;
      entry.resetTime = new Date(now.getTime() + config.windowMs);
    }

    // Check if request would exceed limit
    if (entry.requests >= config.maxRequests) {
      // Block for configured duration
      if (config.blockDurationMs) {
        entry.blocked = true;
        entry.blockUntil = new Date(now.getTime() + config.blockDurationMs);
      }

      this.limits.set(key, entry);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: config.blockDurationMs ? Math.ceil(config.blockDurationMs / 1000) : Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000),
      };
    }

    // Allow request and increment counter
    entry.requests++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.requests,
      resetTime: entry.resetTime,
    };
  }

  async resetLimits(identifier: string, endpoint?: string): Promise<void> {
    if (endpoint) {
      const key = `${identifier}:${endpoint}`;
      this.limits.delete(key);
    } else {
      // Reset all endpoints for this identifier
      const keysToDelete: string[] = [];
      for (const key of this.limits.keys()) {
        if (key.startsWith(`${identifier}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.limits.delete(key));
    }
  }

  async getLimitStatus(identifier: string, endpoint: string): Promise<RateLimitStatus> {
    const config = this.configs.get(endpoint) || this.defaultConfig;
    const key = `${identifier}:${endpoint}`;
    const entry = this.limits.get(key);
    const now = new Date();

    if (!entry || now >= entry.resetTime) {
      return {
        requests: 0,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: new Date(now.getTime() + config.windowMs),
        blocked: false,
      };
    }

    const blocked = entry.blocked && entry.blockUntil ? now < entry.blockUntil : false;

    return {
      requests: entry.requests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.requests),
      resetTime: entry.resetTime,
      blocked,
    };
  }

  configureLimits(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, { ...this.defaultConfig, ...config });
  }

  // Utility method to clean up expired entries (for memory management)
  cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.limits.entries()) {
      // Remove entries that are past their reset time and not blocked
      if (now >= entry.resetTime && (!entry.blocked || !entry.blockUntil || now >= entry.blockUntil)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.limits.delete(key));
  }
}