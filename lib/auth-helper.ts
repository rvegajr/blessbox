/**
 * Auth Helper for NextAuth v5 Beta
 * Provides session retrieval for API routes in NextAuth v5 App Router
 */
import NextAuth from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { Session } from 'next-auth';

/**
 * Get server session - NextAuth v5 beta compatible
 * For route handlers, we decode the session token from cookies
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();

    // Test/dev auth bypass (local-only)
    // Allows Playwright and local smoke tests to access protected API routes without setting up NextAuth.
    if (process.env.NODE_ENV !== 'production') {
      const testAuth = cookieStore.get('bb_test_auth')?.value;
      if (testAuth === '1') {
        const email = cookieStore.get('bb_test_email')?.value || 'seed-local@example.com';
        const orgId = cookieStore.get('bb_test_org_id')?.value;
        const isAdmin = cookieStore.get('bb_test_admin')?.value === '1';
        return {
          user: {
            email,
            name: isAdmin ? 'Test Admin' : 'Test User',
            id: 'test-user',
            // non-standard extra fields used by client pages
            ...(orgId ? { organizationId: orgId } : {}),
            ...(isAdmin ? { role: 'super_admin' } : {}),
          } as any,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as Session;
      }
    }
    
    // Try different cookie names that NextAuth v5 might use
    const sessionToken = 
      cookieStore.get('authjs.session-token')?.value ||
      cookieStore.get('__Secure-authjs.session-token')?.value ||
      cookieStore.get('next-auth.session-token')?.value ||
      cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    if (!process.env.NEXTAUTH_SECRET) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('NEXTAUTH_SECRET not set');
      }
      return null;
    }
    
    try {
      // Decode the JWT token (NextAuth v5 uses JWT by default)
      const decoded = jwt.verify(sessionToken, process.env.NEXTAUTH_SECRET) as any;
      
      if (decoded && decoded.email) {
        return {
          user: {
            email: decoded.email,
            name: decoded.name || 'User',
            id: decoded.id || decoded.sub || '1',
            image: decoded.image || null,
            // non-standard extra fields used by client pages
            ...(decoded.organizationId ? { organizationId: decoded.organizationId } : {}),
            ...(decoded.role ? { role: decoded.role } : {}),
          },
          expires: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as Session;
      }
    } catch (jwtError) {
      // If JWT decode fails, the token might be invalid or expired
      if (process.env.NODE_ENV !== 'test') {
        console.warn('JWT decode error (session may be expired):', jwtError);
      }
      return null;
    }
    
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('getServerSession error:', error);
    }
    return null;
  }
}

/**
 * Export authOptions for compatibility
 */
export { authOptions };
