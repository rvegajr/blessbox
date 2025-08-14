// Security Middleware for API endpoints
import type { APIRoute, APIContext } from 'astro';
import { RateLimiter } from '../implementations/security/RateLimiter';
import { InputValidator } from '../implementations/security/InputValidator';

// Global instances
const rateLimiter = new RateLimiter();
const inputValidator = new InputValidator();

// Configure rate limits for different endpoints
rateLimiter.configureLimits('/api/auth/register', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
});

rateLimiter.configureLimits('/api/auth/login', {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
});

rateLimiter.configureLimits('/api/auth/request-magic-link', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
});

rateLimiter.configureLimits('/api/onboarding/send-verification', {
  maxRequests: 3,
  windowMs: 5 * 60 * 1000, // 5 minutes
  blockDurationMs: 10 * 60 * 1000, // 10 minutes
});

rateLimiter.configureLimits('/api/contact', {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

// Security middleware function
export async function withSecurity(
  context: APIContext,
  handler: (context: APIContext) => Promise<Response>
): Promise<Response> {
  const { request, url } = context;
  const endpoint = url.pathname;
  
  // Get client identifier (IP address with fallback)
  const clientIP = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  try {
    // 1. Rate Limiting Check
    const rateLimitResult = await rateLimiter.checkLimit(clientIP, endpoint);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString(),
          },
        }
      );
    }

    // 2. Input Validation for POST requests
    if (request.method === 'POST') {
      try {
        const body = await request.clone().json();
        const validationResult = await validateRequestBody(body, endpoint);
        
        if (!validationResult.isValid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid input data',
              details: validationResult.errors,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        // If JSON parsing fails, let the handler deal with it
      }
    }

    // 3. Security Headers
    const response = await handler(context);
    
    // Add security headers to response
    const secureResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString(),
      },
    });

    return secureResponse;

  } catch (error) {
    console.error('Security middleware error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal security error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Validate request body based on endpoint
async function validateRequestBody(body: any, endpoint: string): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  switch (endpoint) {
    case '/api/auth/register':
      if (body.email) {
        const emailValidation = inputValidator.validateEmail(body.email);
        if (!emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
      }
      
      if (body.password) {
        const passwordValidation = inputValidator.validatePassword(body.password);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }
      
      if (body.organizationName) {
        const sanitized = inputValidator.sanitizeHtml(body.organizationName);
        if (sanitized !== body.organizationName) {
          errors.push('Organization name contains invalid characters');
        }
      }
      
      if (body.customDomain) {
        const domainValidation = inputValidator.validateDomain(body.customDomain);
        if (!domainValidation.isValid) {
          errors.push(...domainValidation.errors);
        }
      }
      break;

    case '/api/auth/login':
      if (body.email) {
        const emailValidation = inputValidator.validateEmail(body.email);
        if (!emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
      }
      break;

    case '/api/auth/request-magic-link':
      if (body.email) {
        const emailValidation = inputValidator.validateEmail(body.email);
        if (!emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
      }
      break;

    case '/api/onboarding/send-verification':
      if (body.email) {
        const emailValidation = inputValidator.validateEmail(body.email);
        if (!emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
      }
      break;

    case '/api/contact':
      if (body.email) {
        const emailValidation = inputValidator.validateEmail(body.email);
        if (!emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
      }
      
      if (body.message) {
        const sqlValidation = inputValidator.validateSqlSafe(body.message);
        if (!sqlValidation.isValid) {
          errors.push(...sqlValidation.errors);
        }
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}

// Export configured instances for direct use
export { rateLimiter, inputValidator };