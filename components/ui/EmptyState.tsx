// src/components/ui/EmptyState.tsx
'use client';

import React from 'react';
import type { EmptyStateProps } from '../EmptyState.interface';

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  helpLink,
  className = '',
  'data-testid': testId = 'empty-state',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label="Empty state"
    >
      {/* Icon */}
      <div className="mb-4 text-gray-400" aria-hidden="true">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-sm text-gray-600">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className={`
              rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${primaryAction.disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
            aria-label={primaryAction.label}
          >
            {primaryAction.label}
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className={`
              rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${secondaryAction.disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              }
            `}
            aria-label={secondaryAction.label}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>

      {/* Help Link */}
      {helpLink && (
        <div className="mt-4">
          <button
            onClick={helpLink.onClick}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
            aria-label={`${helpLink.text} - Opens help`}
          >
            {helpLink.text}
          </button>
        </div>
      )}
    </div>
  );
}
