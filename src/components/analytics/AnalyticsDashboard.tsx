'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardService } from '@/services/DashboardService'
import { DashboardMetrics } from '@/interfaces/IDashboardService'

interface AnalyticsDashboardProps {
  organizationId: string
}

export function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [dashboardService] = useState(new DashboardService())

  useEffect(() => {
    loadAnalytics()
  }, [organizationId, timeRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const result = await dashboardService.getLiveMetrics(organizationId)
      
      if (result.success && result.data) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (num: number) => {
    return Math.round(num * 100) / 100 + '%'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Comprehensive insights into your registration performance</p>
            </div>
            <div className="flex space-x-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range)}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.registrations.current)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.registrations.change > 0 ? '+' : ''}{analytics.registrations.change}% from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scans</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.scans.current)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.scans.change > 0 ? '+' : ''}{analytics.scans.change}% from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(analytics.conversionRate.current)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.conversionRate.change > 0 ? '+' : ''}{analytics.conversionRate.change}% from previous period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Check-ins</CardTitle>
              <CardDescription>Total check-ins completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.checkIns.current)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.checkIns.change > 0 ? '+' : ''}{analytics.checkIns.change}% from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Registrations:</span>
                  <span className="text-sm font-medium">{formatNumber(analytics.registrations.current)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Scans:</span>
                  <span className="text-sm font-medium">{formatNumber(analytics.scans.current)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-ins:</span>
                  <span className="text-sm font-medium">{formatNumber(analytics.checkIns.current)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate:</span>
                  <span className="text-sm font-medium">{formatPercentage(analytics.conversionRate.current)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}