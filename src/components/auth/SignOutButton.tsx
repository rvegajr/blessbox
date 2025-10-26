'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { SignOutButtonProps } from './types'

/**
 * SignOutButton Component
 * 
 * TDD Implementation: Created to make tests pass
 * ISP Compliance: Single responsibility - authentication actions only
 * 
 * Features:
 * - Client-side sign-out (no page reload)
 * - Loading state during sign-out
 * - Error handling
 * - Customizable styling
 * - Accessibility support
 */
export function SignOutButton({ 
  variant = 'outline', 
  callbackUrl = '/',
  className 
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl })
    } catch (error) {
      console.error('Sign out failed:', error)
      // Error is handled gracefully - user can try again
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button 
      variant={variant}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      type="button"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}