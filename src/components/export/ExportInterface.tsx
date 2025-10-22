'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExportService, ExportOptions } from '@/services/ExportService'

interface ExportInterfaceProps {
  organizationId: string
}

export function ExportInterface({ organizationId }: ExportInterfaceProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'registrations' | 'analytics' | 'report'>('registrations')
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  })
  const [filters, setFilters] = useState({
    status: '',
    qrCodeId: ''
  })
  const [exportService] = useState(new ExportService())

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const options: ExportOptions = {
        format: exportFormat,
        dateRange: getDateRange(),
        filters: {
          status: filters.status || undefined,
          qrCodeId: filters.qrCodeId || undefined
        }
      }

      let result
      switch (exportType) {
        case 'registrations':
          result = await exportService.exportRegistrations(organizationId, options)
          break
        case 'analytics':
          result = await exportService.exportQRAnalytics(organizationId, options)
          break
        case 'report':
          result = await exportService.exportOrganizationReport(organizationId, options)
          break
      }

      if (result.success && result.data) {
        // Download the file
        downloadFile(result.data, result.filename || 'export')
      } else {
        alert(`Export failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getDateRange = () => {
    if (dateRange === 'custom') {
      return {
        start: new Date(customDateRange.start),
        end: new Date(customDateRange.end)
      }
    }

    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    return {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  }

  const downloadFile = (data: string | Buffer, filename: string) => {
    const blob = new Blob([data], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
        <p className="text-gray-600 mt-2">Export your data in various formats for analysis and reporting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>Choose what data to export and in what format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'registrations', label: 'Registrations', description: 'All attendee registrations', icon: '📋' },
                  { value: 'analytics', label: 'QR Analytics', description: 'QR code scan data and analytics', icon: '📊' },
                  { value: 'report', label: 'Organization Report', description: 'Comprehensive organization report', icon: '📄' }
                ].map((type) => (
                  <label key={type.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportType"
                      value={type.value}
                      checked={exportType === type.value}
                      onChange={(e) => setExportType(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{type.icon}</span>
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'csv', label: 'CSV', icon: '📊' },
                  { value: 'pdf', label: 'PDF', icon: '📄' },
                  { value: 'excel', label: 'Excel', icon: '📈' }
                ].map((format) => (
                  <label key={format.value} className="flex flex-col items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format.value}
                      checked={exportFormat === format.value}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-2xl mt-2">{format.icon}</span>
                    <span className="text-sm font-medium text-gray-900 mt-1">{format.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Date Range
              </label>
              <div className="space-y-2">
                {[
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                  { value: 'custom', label: 'Custom range' }
                ].map((range) => (
                  <label key={range.value} className="flex items-center">
                    <input
                      type="radio"
                      name="dateRange"
                      value={range.value}
                      checked={dateRange === range.value}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>

              {dateRange === 'custom' && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filters (Optional)
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="checked_in">Checked In</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code ID
                  </label>
                  <input
                    type="text"
                    value={filters.qrCodeId}
                    onChange={(e) => setFilters(prev => ({ ...prev, qrCodeId: e.target.value }))}
                    placeholder="Filter by specific QR code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Export Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
            <CardDescription>Preview of your export configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{exportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium uppercase">{exportFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date Range:</span>
                    <span className="font-medium">
                      {dateRange === 'custom' 
                        ? `${customDateRange.start} to ${customDateRange.end}`
                        : `Last ${dateRange.replace('d', ' days')}`
                      }
                    </span>
                  </div>
                  {filters.status && (
                    <div className="flex justify-between">
                      <span>Status Filter:</span>
                      <span className="font-medium capitalize">{filters.status}</span>
                    </div>
                  )}
                  {filters.qrCodeId && (
                    <div className="flex justify-between">
                      <span>QR Code Filter:</span>
                      <span className="font-medium">{filters.qrCodeId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Export Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Real-time data export</li>
                  <li>• Multiple format support</li>
                  <li>• Custom date ranges</li>
                  <li>• Advanced filtering</li>
                  <li>• Secure data handling</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Data Privacy</h4>
                <p className="text-sm text-green-800">
                  All exported data is handled securely and contains only the information you have access to. 
                  Personal data is protected according to our privacy policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

