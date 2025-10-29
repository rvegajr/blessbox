// src/components/dashboard/StatCard.tsx
'use client';

import React from 'react';
import type { StatCardProps } from '@/interfaces/Dashboard.interface';

export function StatCard({
  title,
  value,
  change,
  icon,
  className = '',
  'data-testid': testId = 'stat-card',
}: StatCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    if (val == null || val === undefined) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return val.toLocaleString();
    return val.toString();
  };

  const formatChange = (changeValue: number, type: 'increase' | 'decrease' | 'neutral'): string => {
    const prefix = type === 'increase' ? '+' : type === 'decrease' ? '-' : '';
    return `${prefix}${changeValue}%`;
  };

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral'): string => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label={`${title}: ${formatValue(value)}`}
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
          {change && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm font-medium ${getChangeColor(change.type)}`}>
                {formatChange(change.value, change.type)}
              </span>
              <span className="ml-2 text-sm text-gray-500">{change.period}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4" data-testid="stat-icon">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
