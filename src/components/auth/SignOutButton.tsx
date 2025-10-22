/**
 * Sign Out Button Component
 * 
 * Client-side sign-out button that preserves SPA behavior
 * Uses NextAuth.js client-side API for proper sign-out handling
 */

'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  return (
    <Button 
      variant="outline"
      onClick={handleSignOut}
      type="button"
    >
      Sign Out
    </Button>
  )
}

