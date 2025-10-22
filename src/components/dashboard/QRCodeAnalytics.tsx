'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface QRCodeAnalytics {
  qrCodeId: string
  qrCodeSetId: string
  label: string
  entryPoint: string
  totalScans: number
  uniqueScans: number
  conversionRate: number
  lastScanned?: string
  scansByDay: Array<{
    date: string
    scans: number
    uniqueScans: number
    conversions: number
  }>
  topDevices: Array<{
    deviceType: string
    count: number
    percentage: number
  }>
  topBrowsers: Array<{
    browser: string
    count: number
    percentage: number
  }>
}

interface QRCodeAnalyticsProps {
  qrCodeSetId: string
}

export default function QRCodeAnalytics({ qrCodeSetId }: QRCodeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<QRCodeAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/qr-codes/analytics?qrCodeSetId=${qrCodeSetId}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [qrCodeSetId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code Analytics</CardTitle>
          <CardDescription>Performance metrics for your QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code Analytics</CardTitle>
          <CardDescription>Performance metrics for your QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-600">
              Analytics will appear here once people start scanning your QR codes.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Analytics</CardTitle>
        <CardDescription>Performance metrics for your QR codes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {analytics.map((qrCode) => (
            <div key={qrCode.qrCodeId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{qrCode.label}</h3>
                  <p className="text-sm text-gray-600">Entry Point: {qrCode.entryPoint}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{qrCode.totalScans}</div>
                  <div className="text-sm text-gray-600">Total Scans</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{qrCode.uniqueScans}</div>
                  <div className="text-sm text-gray-600">Unique Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(qrCode.conversionRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {qrCode.topDevices[0]?.deviceType || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Top Device</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {qrCode.topBrowsers[0]?.browser || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Top Browser</div>
                </div>
              </div>

              {qrCode.lastScanned && (
                <div className="mt-4 text-sm text-gray-600">
                  Last scanned: {new Date(qrCode.lastScanned).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

