// src/components/dashboard/DashboardLayout.tsx
'use client';

import React from 'react';
import { StatCard } from './StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DashboardLayoutProps } from '@/interfaces/Dashboard.interface';

export function DashboardLayout({
  stats,
  qrCodeSets,
  activities,
  quickActions,
  onCreateQRCode,
  onEditQRCode,
  onDeleteQRCode,
  onViewAllActivities,
  isLoading = false,
  className = '',
  'data-testid': testId = 'dashboard-layout',
}: DashboardLayoutProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen bg-gray-50 ${className}`.trim()}
        data-testid={testId}
        role="main"
        aria-label="Dashboard"
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${className}`.trim()}
      data-testid={testId}
      role="main"
      aria-label="Dashboard"
    >
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your QR codes.</p>
        </div>

        {/* Stats Section */}
        <div className="mb-8" data-testid="dashboard-stats">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Registrations"
              value={stats?.totalRegistrations ?? 0}
              icon={<div className="text-blue-600">👥</div>}
              data-testid="stat-card"
            />
            <StatCard
              title="Total QR Codes"
              value={stats?.totalQRCodes ?? 0}
              icon={<div className="text-green-600">📱</div>}
              data-testid="stat-card"
            />
            <StatCard
              title="Active Events"
              value={stats?.activeEvents ?? 0}
              icon={<div className="text-purple-600">🎯</div>}
              data-testid="stat-card"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats?.conversionRate ?? 0}%`}
              icon={<div className="text-orange-600">📊</div>}
              data-testid="stat-card"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" data-testid="dashboard-grid">
          {/* QR Codes Section */}
          <div className="lg:col-span-1" data-testid="qr-codes-section">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">QR Code Sets</h2>
                <button
                  onClick={onCreateQRCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create New
                </button>
              </div>
              
              {qrCodeSets && qrCodeSets.length > 0 ? (
                <div className="space-y-4">
                  {qrCodeSets.map((qrCode) => (
                    <div
                      key={qrCode.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{qrCode.name}</h3>
                          {qrCode.description && (
                            <p className="text-sm text-gray-600 mt-1">{qrCode.description}</p>
                          )}
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-sm text-gray-500">
                              {qrCode.registrations} registrations
                            </span>
                            <span className="text-sm text-gray-500">
                              Created {formatDate(qrCode.createdAt)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              qrCode.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : qrCode.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {qrCode.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onEditQRCode(qrCode.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteQRCode(qrCode.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<div className="text-6xl">📱</div>}
                  title="No QR Codes Yet"
                  description="Create your first QR code to start collecting registrations"
                  primaryAction={{
                    label: 'Create QR Code',
                    onClick: onCreateQRCode,
                  }}
                  secondaryAction={{
                    label: 'Watch Tutorial',
                    onClick: () => console.log('Open tutorial'),
                  }}
                />
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="lg:col-span-1" data-testid="recent-activity">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <button
                  onClick={onViewAllActivities}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Activity
                </button>
              </div>
              
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<div className="text-6xl">📈</div>}
                  title="No Recent Activity"
                  description="Activity will appear here as users interact with your QR codes"
                  primaryAction={{
                    label: 'Create QR Code',
                    onClick: onCreateQRCode,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div data-testid="quick-actions">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`p-4 rounded-lg border-2 border-dashed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    action.disabled 
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50' 
                      : 'cursor-pointer border-gray-300 hover:border-gray-400'
                  } ${
                    !action.disabled && action.variant === 'primary' 
                      ? 'border-blue-300 hover:border-blue-400' 
                      : !action.disabled && action.variant === 'secondary'
                      ? 'border-green-300 hover:border-green-400'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
