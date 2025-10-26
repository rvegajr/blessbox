import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import OrganizationStats from '@/components/dashboard/OrganizationStats'
import QRCodeSetsList from '@/components/dashboard/QRCodeSetsList'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { DashboardTutorialButton } from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
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
              <h1 className="ml-3 text-2xl font-bold text-gray-900">BlessBox Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {session.user?.name || session.user?.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Organization Stats */}
          <div className="mb-8" id="dashboard-stats">
            <OrganizationStats />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Sets */}
            <div id="qr-codes-section">
              <QRCodeSetsList />
            </div>

            {/* Recent Activity */}
            <div id="recent-activity">
              <RecentActivity />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8" id="quick-actions">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild className="h-20 flex flex-col">
                <Link href="/dashboard/qr-codes">
                  <span className="text-2xl mb-2">📱</span>
                  <span>Create QR Codes</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-20 flex flex-col">
                <Link href="/dashboard/forms">
                  <span className="text-2xl mb-2">📝</span>
                  <span>Build Forms</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-20 flex flex-col">
                <Link href="/dashboard/registrations">
                  <span className="text-2xl mb-2">📊</span>
                  <span>View Registrations</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-20 flex flex-col">
                <Link href="/dashboard/settings">
                  <span className="text-2xl mb-2">⚙️</span>
                  <span>Settings</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Getting Started */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Welcome to BlessBox! Here's how to get started with your QR-based registration system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Create Your First QR Code Set</h3>
                      <p className="text-sm text-gray-600">
                        Generate QR codes for your events, programs, or registration needs.
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href="/dashboard/qr-codes">Create QR Codes</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">2</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Build Registration Forms</h3>
                      <p className="text-sm text-gray-600">
                        Design custom forms to collect information from your registrants.
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-2">
                        <Link href="/dashboard/forms">Build Forms</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">3</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Share and Track</h3>
                      <p className="text-sm text-gray-600">
                        Share your QR codes and track registrations in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Tutorial Button - Floating */}
      <DashboardTutorialButton />
    </div>
  )
}
