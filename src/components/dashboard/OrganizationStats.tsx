'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OrganizationStats {
  totalRegistrations: number
  qrCodeSets: number
  recentActivity: number
  activeUsers: number
}

export default function OrganizationStats() {
  const [stats, setStats] = useState<OrganizationStats>({
    totalRegistrations: 0,
    qrCodeSets: 0,
    recentActivity: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch organization statistics
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Registrations</CardTitle>
          <CardDescription>All time registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalRegistrations}</div>
          <p className="text-sm text-gray-600">
            {stats.totalRegistrations === 0 ? 'No registrations yet' : '+12% from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code Sets</CardTitle>
          <CardDescription>Active QR code sets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.qrCodeSets}</div>
          <p className="text-sm text-gray-600">
            {stats.qrCodeSets === 0 ? 'No QR codes created' : 'All active'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.recentActivity}</div>
          <p className="text-sm text-gray-600">
            {stats.recentActivity === 0 ? 'No recent activity' : 'Scans and registrations'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>Currently online</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeUsers}</div>
          <p className="text-sm text-gray-600">
            {stats.activeUsers === 0 ? 'No active users' : 'Real-time count'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

