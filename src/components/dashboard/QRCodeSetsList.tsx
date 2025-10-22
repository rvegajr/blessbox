'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface QRCodeSet {
  id: string
  name: string
  language: string
  qrCodes: Array<{
    id: string
    label: string
    entryPoint: string
    isActive: boolean
    url?: string
  }>
  isActive: boolean
  scanCount: number
  createdAt: string
}

export default function QRCodeSetsList() {
  const [qrCodeSets, setQrCodeSets] = useState<QRCodeSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQRCodeSets = async () => {
      try {
        const response = await fetch('/api/qr-codes?organizationId=current')
        if (response.ok) {
          const data = await response.json()
          setQrCodeSets(data)
        }
      } catch (error) {
        console.error('Error fetching QR code sets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQRCodeSets()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code Sets</CardTitle>
          <CardDescription>Your active QR code sets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (qrCodeSets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code Sets</CardTitle>
          <CardDescription>Your active QR code sets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Code Sets Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first QR code set to start collecting registrations.
            </p>
            <Button asChild>
              <Link href="/dashboard/qr-codes/create">Create QR Code Set</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>QR Code Sets</CardTitle>
            <CardDescription>Your active QR code sets</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/qr-codes/create">Create New</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {qrCodeSets.map((set) => (
            <div key={set.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{set.name}</h3>
                  <p className="text-sm text-gray-600">
                    {set.qrCodes.length} QR codes • {set.scanCount} total scans
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    set.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {set.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/qr-codes/${set.id}`}>View</Link>
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  Created: {new Date(set.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

