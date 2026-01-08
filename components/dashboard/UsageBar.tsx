'use client';

import React from 'react';
import Link from 'next/link';
import type { UsageDisplayData, UsageStatus } from '@/lib/interfaces/IUsageDisplay';

/** Subscription data for displaying status in the consolidated usage bar */
export interface SubscriptionInfo {
  status: 'active' | 'canceling' | 'canceled' | 'none';
  currentPeriodEnd?: string;
}

export interface UsageBarProps {
  usage: UsageDisplayData;
  subscription?: SubscriptionInfo | null;
  showUpgradeLink?: boolean;
  onCancelClick?: () => void;
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
  subscription,
  showUpgradeLink = true,
  onCancelClick,
  className = '',
  'data-testid': testId = 'usage-bar',
}: UsageBarProps) {
  const colors = statusColors[usage.status];
  const planLabel = planLabels[usage.planType] || 'Free Plan';
  const barWidth = Math.min(usage.percentage, 100);

  const canUpgrade = usage.planType !== 'enterprise';
  const canCancel = subscription?.status === 'active' && usage.planType !== 'free';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label={`Registration usage: ${usage.currentCount} of ${usage.limit}`}
    >
      {/* Header with Plan & Status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Registration Usage</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-semibold text-gray-900">{planLabel}</p>
            {subscription?.status === 'active' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Active
              </span>
            )}
            {subscription?.status === 'canceling' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                Canceling
              </span>
            )}
          </div>
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

      {/* Warning/Critical Status Messages with Upgrade Link */}
      {usage.status === 'warning' && showUpgradeLink && canUpgrade && (
        <div className={`mt-4 p-3 rounded-lg ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>
            <span className="font-medium">⚠️ Approaching limit</span>
            {' — '}
            <Link 
              href="/pricing"
              data-testid="link-upgrade-warning"
              className="underline hover:no-underline font-medium"
            >
              Upgrade your plan
            </Link>
            {' to continue adding registrations.'}
          </p>
        </div>
      )}

      {usage.status === 'critical' && showUpgradeLink && canUpgrade && (
        <div className={`mt-4 p-3 rounded-lg ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>
            <span className="font-medium">🚨 {usage.remaining === 0 ? 'Limit reached' : 'Nearly at limit'}</span>
            {' — '}
            <Link 
              href="/pricing"
              data-testid="link-upgrade-critical"
              className="underline hover:no-underline font-medium"
            >
              Upgrade now
            </Link>
            {usage.remaining === 0 
              ? ' to continue accepting registrations.' 
              : ' before you run out of registrations.'}
          </p>
        </div>
      )}

      {/* Canceling Notice */}
      {subscription?.status === 'canceling' && subscription.currentPeriodEnd && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50">
          <p className="text-sm text-yellow-700">
            Your subscription will end on{' '}
            <span className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
            . You'll retain access until then.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          {canCancel && onCancelClick && (
            <button
              onClick={onCancelClick}
              data-testid="btn-cancel-subscription"
              className="text-sm text-red-600 hover:text-red-800"
              aria-label="Cancel subscription"
            >
              Cancel subscription
            </button>
          )}
        </div>
        <div>
          {showUpgradeLink && canUpgrade && (
            <Link
              href="/pricing"
              data-testid="link-view-plans"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              aria-label="View all pricing plans"
            >
              View Plans →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsageBar;
