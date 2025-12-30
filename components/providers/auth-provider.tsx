/**
 * AuthProvider - Client-side authentication provider
 * 
 * Manages session state and provides authentication methods.
 * Replaces NextAuth's SessionProvider.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AuthContext, type AuthState, type AuthContextValue, type Organization } from '@/lib/hooks/useAuth';
import type { AuthUser } from '@/lib/interfaces/IAuthService';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: 'loading',
    expires: null,
    organizations: [],
    activeOrganizationId: null,
  });

  // Fetch session on mount
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        setState({ user: null, status: 'unauthenticated', expires: null, organizations: [], activeOrganizationId: null });
        return;
      }

      const data = await response.json();
      
      if (data.user) {
        const organizations = (data.organizations || []) as Organization[];
        const activeOrgId = data.activeOrganizationId || data.user.organizationId || null;
        
        // Update user with active org if available
        const user = data.user as AuthUser;
        if (activeOrgId && !user.organizationId) {
          user.organizationId = activeOrgId;
        }
        
        setState({
          user,
          status: 'authenticated',
          expires: data.expires || null,
          organizations,
          activeOrganizationId: activeOrgId,
        });
      } else {
        setState({ user: null, status: 'unauthenticated', expires: null, organizations: [], activeOrganizationId: null });
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setState({ user: null, status: 'unauthenticated', expires: null, organizations: [], activeOrganizationId: null });
    }
  }, []);

  // Initial session fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Automatic session refresh every 5 minutes to prevent timeout
  useEffect(() => {
    // Only refresh if authenticated
    if (state.status !== 'authenticated') return;

    const intervalId = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [state.status, refresh]);

  // Send verification code
  const sendCode = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send code' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  // Verify code and create session
  const verifyCode = useCallback(async (
    email: string, 
    code: string, 
    organizationId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, organizationId }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      // Update state with new session
      setState({
        user: data.user as AuthUser,
        status: 'authenticated',
        expires: data.expires || null,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setState({ user: null, status: 'unauthenticated', expires: null, organizations: [], activeOrganizationId: null });
  }, []);

  // Set active organization
  const setActiveOrganization = useCallback(async (organizationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/me/active-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to set active organization' };
      }

      // Update local state
      setState(prev => ({
        ...prev,
        activeOrganizationId: organizationId,
        user: prev.user ? { ...prev.user, organizationId } : null,
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    sendCode,
    verifyCode,
    logout,
    refresh,
    setActiveOrganization,
  }), [state, sendCode, verifyCode, logout, refresh, setActiveOrganization]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

