/**
 * Auth Helper - Server-side session retrieval
 * 
 * Uses JWT-based authentication with 6-digit email verification.
 * Email is the source of truth for identity.
 */
import { AuthService, authService } from '@/lib/services/AuthService';
import type { AuthSession, AuthUser } from '@/lib/interfaces/IAuthService';

// Re-export types for compatibility
export type { AuthSession, AuthUser };

// Session type compatible with existing code
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    organizationId?: string;
    role?: string;
  };
  expires: string;
}

/**
 * Get server session from cookies
 * Compatible with existing getServerSession() usage
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const session = await authService.getSession();
    
    if (!session) {
      return null;
    }

    // Convert to compatible Session format
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
      },
      expires: session.expires,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('getServerSession error:', error);
    }
    return null;
  }
}

// Export auth service for direct use
export { authService, AuthService };
