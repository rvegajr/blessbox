/**
 * SignOutButton Component Tests
 * 
 * TDD Approach: Test-Driven Development
 * 1. Write test first (Red phase)
 * 2. Implement minimum code to pass (Green phase)
 * 3. Refactor while keeping tests green (Refactor phase)
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { SignOutButton } from './SignOutButton'
import { signOut } from 'next-auth/react'
import { vi } from 'vitest'

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn()
}))

const mockSignOut = signOut as any

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Basic Functionality', () => {
    it('should render sign out button', () => {
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      expect(button).toBeInTheDocument()
    })

    it('should call signOut when clicked without page reload', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
      })
      
      // Verify no page navigation occurred (SPA behavior)
      expect(window.location.href).toBe('http://localhost/')
    })

    it('should use default callback URL when none provided', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
      })
    })

    it('should use custom callback URL when provided', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      render(<SignOutButton callbackUrl="/custom-redirect" />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/custom-redirect' })
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during sign-out', async () => {
      // Mock a delayed signOut
      mockSignOut.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      // Should show loading state
      expect(screen.getByText('Signing out...')).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('should return to normal state after sign-out completes', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle sign-out errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))
      
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Sign out failed:', expect.any(Error))
        expect(button).not.toBeDisabled()
      })
      
      consoleSpy.mockRestore()
    })

    it('should not be disabled after error', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))
      
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(button)
      
      // Wait for the error to be handled and loading state to be cleared
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      }, { timeout: 1000 })
    })
  })

  describe('Props and Styling', () => {
    it('should accept custom className', () => {
      render(<SignOutButton className="custom-class" />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      expect(button).toHaveClass('custom-class')
    })

    it('should use default variant when none provided', () => {
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      // Check for outline variant classes (border, bg-background, etc.)
      expect(button).toHaveClass('border', 'bg-background')
    })

    it('should use custom variant when provided', () => {
      render(<SignOutButton variant="default" />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      // Check for default variant classes (bg-primary, text-primary-foreground)
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      button.focus()
      
      expect(button).toHaveFocus()
    })

    it('should have proper ARIA attributes', () => {
      render(<SignOutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      expect(button).toHaveAttribute('type', 'button')
    })
  })
})
