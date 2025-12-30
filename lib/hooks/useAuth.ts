/**
 * useAuth - Client-side authentication hook
 * 
 * Provides session state and authentication methods.
 * Replaces NextAuth's useSession() hook.
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { AuthUser } from '@/lib/interfaces/IAuthService';

export interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  role: string;
}

export interface AuthState {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  expires: string | null;
  organizations: Organization[];
  activeOrganizationId: string | null;
}

export interface AuthContextValue extends AuthState {
  /**
   * Send verification code to email
   */
  sendCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  /**
   * Verify code and create session
   */
  verifyCode: (email: string, code: string, organizationId?: string) => Promise<{ success: boolean; error?: string }>;
  
  /**
   * Log out current user
   */
  logout: () => Promise<void>;
  
  /**
   * Refresh session from server
   */
  refresh: () => Promise<void>;
  
  /**
   * Set active organization
   */
  setActiveOrganization: (organizationId: string) => Promise<{ success: boolean; error?: string }>;
}

// Default context value for SSR/static generation
const defaultContextValue: AuthContextValue = {
  user: null,
  status: 'loading',
  expires: null,
  organizations: [],
  activeOrganizationId: null,
  sendCode: async () => ({ success: false, error: 'Auth not initialized' }),
  verifyCode: async () => ({ success: false, error: 'Auth not initialized' }),
  logout: async () => {},
  refresh: async () => {},
  setActiveOrganization: async () => ({ success: false, error: 'Auth not initialized' }),
};

const AuthContext = createContext<AuthContextValue>(defaultContextValue);

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  // During SSR/static generation, useContext might not have proper context
  try {
    const context = useContext(AuthContext);
    return context || defaultContextValue;
  } catch {
    return defaultContextValue;
  }
}

/**
 * Hook for session data only (compatible with existing useSession pattern)
 */
export function useSession(): { data: { user: AuthUser } | null; status: AuthState['status'] } {
  try {
    const auth = useAuth();
    return {
      data: auth.user ? { user: auth.user } : null,
      status: auth.status,
    };
  } catch {
    return {
      data: null,
      status: 'loading',
    };
  }
}

export { AuthContext };

