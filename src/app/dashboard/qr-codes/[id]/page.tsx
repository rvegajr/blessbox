'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface QRCodeSet {
  id: string
  name: string
  language: string
  formFields: Array<{
    id: string
    type: string
    label: string
    required: boolean
  }>
  qrCodes: Array<{
    id: string
    label: string
    entryPoint: string
    isActive: boolean
    url?: string
    scanCount?: number
  }>
  isActive: boolean
  scanCount: number
  createdAt: string
}

export default function QRCodeSetDetailPage() {
  const params = useParams()
  const [qrCodeSet, setQrCodeSet] = useState<QRCodeSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQRCodeSet = async () => {
      try {
        const response = await fetch(`/api/qr-codes/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setQrCodeSet(data)
        } else {
          setError('Failed to load QR code set')
        }
      } catch (error) {
        setError('An error occurred while loading the QR code set')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQRCodeSet()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/qr-codes">← Back to QR Code Sets</Link>
                </Button>
                <h1 className="ml-4 text-2xl font-bold text-gray-900">Loading...</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !qrCodeSet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/qr-codes">← Back to QR Code Sets</Link>
                </Button>
                <h1 className="ml-4 text-2xl font-bold text-gray-900">Error</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading QR Code Set</h3>
                <p className="text-gray-600">{error}</p>
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
              <Button variant="outline" asChild>
                <Link href="/dashboard/qr-codes">← Back to QR Code Sets</Link>
              </Button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">{qrCodeSet.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                qrCodeSet.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {qrCodeSet.isActive ? 'Active' : 'Inactive'}
              </span>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total Scans</CardTitle>
                <CardDescription>All time scans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{qrCodeSet.scanCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QR Codes</CardTitle>
                <CardDescription>Active QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{qrCodeSet.qrCodes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Registration fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{qrCodeSet.formFields.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* QR Codes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>QR Codes</CardTitle>
                <CardDescription>Individual QR codes in this set</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qrCodeSet.qrCodes.map((qrCode) => (
                    <div key={qrCode.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{qrCode.label}</h3>
                          <p className="text-sm text-gray-600">
                            Entry Point: {qrCode.entryPoint}
                          </p>
                          {qrCode.scanCount && (
                            <p className="text-sm text-gray-600">
                              Scans: {qrCode.scanCount}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            qrCode.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {qrCode.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Registration form configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qrCodeSet.formFields.map((field) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{field.label}</h3>
                          <p className="text-sm text-gray-600">
                            Type: {field.type} {field.required && '(Required)'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          field.required 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {field.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Manage your QR code set</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button>
                    Download All QR Codes
                  </Button>
                  <Button variant="outline">
                    Export Data
                  </Button>
                  <Button variant="outline">
                    View Analytics
                  </Button>
                  <Button variant="outline">
                    Share QR Codes
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

