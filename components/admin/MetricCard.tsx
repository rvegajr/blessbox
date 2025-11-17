'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  description,
  className = ''
}: MetricCardProps) {
  const formatTrendValue = (val: number) => {
    if (val > 0) return `+${val}%`;
    return `${val}%`;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`.trim()}
      data-testid="metric-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && trendValue !== undefined && (
              <span
                className={`text-sm font-medium ${getTrendColor()}`}
                data-testid="trend-indicator"
              >
                {getTrendIcon()} {formatTrendValue(trendValue)}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-2 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
