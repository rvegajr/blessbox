import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import QRCodeSetsList from '@/components/dashboard/QRCodeSetsList'

export default async function QRCodeSetsPage() {
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
              <Button variant="outline" asChild>
                <Link href="/dashboard">← Back to Dashboard</Link>
              </Button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">QR Code Sets</h1>
            </div>
            <Button asChild>
              <Link href="/dashboard/qr-codes/create">Create New QR Code Set</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <QRCodeSetsList />
        </div>
      </main>
    </div>
  )
}

