'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function EmailVerificationPage() {
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Get email from localStorage or context
    const savedEmail = localStorage.getItem('organizationEmail')
    if (savedEmail) {
      setEmail(savedEmail)
    } else {
      // Redirect back to organization setup if no email
      router.push('/onboarding/organization-setup')
    }
  }, [router])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationCode
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/onboarding/form-builder')
        }, 2000)
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('An error occurred during verification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setTimeLeft(60) // 60 seconds cooldown
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to resend verification code')
      }
    } catch (error) {
      setError('An error occurred while resending the code')
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-900">BlessBox Setup</h1>
              </div>
              <div className="text-sm text-gray-600">
                Step 2 of 5: Email Verification
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  Your organization email has been verified. Redirecting to form builder...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">BlessBox Setup</h1>
            </div>
            <div className="text-sm text-gray-600">
              Step 2 of 5: Email Verification
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Organization Setup</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Email Verification</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded">
                  <div className="h-1 bg-blue-600 rounded" style={{ width: '40%' }}></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">3</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">Form Builder</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">4</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">QR Configuration</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">5</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Email Address</CardTitle>
              <CardDescription>
                We've sent a verification code to <strong>{email}</strong>. Please check your email and enter the code below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Didn't receive the code? Check your spam folder or
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={isResending || timeLeft > 0}
                  >
                    {isResending ? 'Resending...' : timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend Code'}
                  </Button>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Email Address'}
                  </Button>
                </div>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• The verification code expires in 10 minutes</li>
                  <li>• Contact support if you continue to have issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

