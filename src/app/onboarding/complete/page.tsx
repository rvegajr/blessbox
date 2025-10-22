'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OnboardingSummary {
  organizationName: string
  eventName: string
  contactEmail: string
  formFieldsCount: number
  qrCodesCount: number
  qrCodeSetName: string
}

export default function OnboardingCompletePage() {
  const [summary, setSummary] = useState<OnboardingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchOnboardingSummary = async () => {
      try {
        const response = await fetch('/api/onboarding/summary')
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
        } else {
          setError('Failed to load onboarding summary')
        }
      } catch (error) {
        setError('An error occurred while loading the summary')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOnboardingSummary()
  }, [])

  const handleAccessDashboard = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your setup summary...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
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
              <h1 className="ml-3 text-2xl font-bold text-gray-900">BlessBox Setup Complete!</h1>
            </div>
            <div className="text-sm text-gray-600">
              Step 5 of 5: Complete
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
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Email Verification</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Form Builder</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">QR Configuration</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Congratulations!</h2>
            <p className="text-xl text-gray-600 mb-6">
              Your BlessBox account has been successfully set up and is ready to use.
            </p>
          </div>

          {/* Setup Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">{summary.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event:</span>
                  <span className="font-medium">{summary.eventName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Email:</span>
                  <span className="font-medium">{summary.contactEmail}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QR Code Setup</CardTitle>
                <CardDescription>Your QR code configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">QR Code Set:</span>
                  <span className="font-medium">{summary.qrCodeSetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">QR Codes Created:</span>
                  <span className="font-medium">{summary.qrCodesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Form Fields:</span>
                  <span className="font-medium">{summary.formFieldsCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>Here's what you can do with your new BlessBox account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="font-medium text-gray-900 mb-2">Download QR Codes</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download your QR codes and start sharing them with your audience.
                  </p>
                  <Button variant="outline" size="sm">
                    Download QR Codes
                  </Button>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="font-medium text-gray-900 mb-2">Track Analytics</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Monitor scans, registrations, and engagement in real-time.
                  </p>
                  <Button variant="outline" size="sm">
                    View Analytics
                  </Button>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-3">⚙️</div>
                  <h3 className="font-medium text-gray-900 mb-2">Manage Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Customize your forms, update organization details, and more.
                  </p>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="text-center">
            <Button
              onClick={handleAccessDashboard}
              size="lg"
              className="mr-4"
            >
              Access Your Dashboard
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
            >
              <Link href="/dashboard/qr-codes">Manage QR Codes</Link>
            </Button>
          </div>

          {/* Support Information */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  Our support team is here to help you get the most out of your BlessBox account.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="sm">
                    View Documentation
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

