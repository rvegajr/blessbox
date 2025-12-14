'use client';

import React from 'react';
import type { UsageDisplayData, UsageStatus } from '@/lib/interfaces/IUsageDisplay';

export interface UsageBarProps {
  usage: UsageDisplayData;
  showUpgradeLink?: boolean;
  className?: string;
  'data-testid'?: string;
}

const statusColors: Record<UsageStatus, { bar: string; text: string; bg: string }> = {
  ok: {
    bar: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50'
  },
  warning: {
    bar: 'bg-yellow-500',
    text: 'text-yellow-700',
    bg: 'bg-yellow-50'
  },
  critical: {
    bar: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50'
  }
};

const planLabels: Record<string, string> = {
  free: 'Free Plan',
  standard: 'Standard Plan',
  enterprise: 'Enterprise Plan'
};

export function UsageBar({
  usage,
  showUpgradeLink = true,
  className = '',
  'data-testid': testId = 'usage-bar',
}: UsageBarProps) {
  const colors = statusColors[usage.status];
  const planLabel = planLabels[usage.planType] || 'Free Plan';
  const barWidth = Math.min(usage.percentage, 100);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label={`Registration usage: ${usage.currentCount} of ${usage.limit}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Registration Usage</h3>
          <p className="text-lg font-semibold text-gray-900">{planLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {usage.currentCount.toLocaleString()}
            <span className="text-lg font-normal text-gray-500">
              {' / '}{usage.limit.toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-300`}
            style={{ width: `${barWidth}%` }}
            role="progressbar"
            aria-valuenow={usage.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${usage.percentage}% used`}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-500">{usage.percentage}% used</span>
          <span className="text-gray-500">{usage.remaining.toLocaleString()} remaining</span>
        </div>
      </div>

      {/* Status Messages */}
      {usage.status === 'warning' && showUpgradeLink && (
        <div className={`mt-4 p-3 rounded-lg ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>
            <span className="font-medium">⚠️ Approaching limit</span>
            {' — '}
            <a 
              href="/pricing" 
              className="underline hover:no-underline font-medium"
            >
              Upgrade your plan
            </a>
            {' to continue adding registrations.'}
          </p>
        </div>
      )}

      {usage.status === 'critical' && showUpgradeLink && (
        <div className={`mt-4 p-3 rounded-lg ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>
            <span className="font-medium">🚨 {usage.remaining === 0 ? 'Limit reached' : 'Nearly at limit'}</span>
            {' — '}
            <a 
              href="/pricing" 
              className="underline hover:no-underline font-medium"
            >
              Upgrade now
            </a>
            {usage.remaining === 0 
              ? ' to continue accepting registrations.' 
              : ' before you run out of registrations.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default UsageBar;
