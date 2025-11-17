'use client';

import React from 'react';
import type { StatCardProps } from '@/interfaces/Dashboard.interface';

export function StatCardEnhanced({
  title,
  value,
  change,
  icon,
  className = '',
  onClick,
  'data-testid': testId = 'stat-card',
}: StatCardProps & { onClick?: () => void }) {
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
        return 'text-green-600 bg-green-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const cardClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200 p-6 
    transition-all duration-200
    ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}
    ${className}
  `.trim();

  return (
    <div
      className={cardClasses}
      data-testid={testId}
      role="region"
      aria-label={`${title}: ${formatValue(value)}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{formatValue(value)}</p>
          {change && (
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getChangeColor(change.type)}`}>
              <span>{formatChange(change.value, change.type)}</span>
              {change.period && (
                <span className="ml-1 text-gray-500">{change.period}</span>
              )}
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








