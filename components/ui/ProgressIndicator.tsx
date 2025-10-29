// src/components/ui/ProgressIndicator.tsx
'use client';

import React from 'react';
import type { ProgressIndicatorProps } from '../ProgressIndicator.interface';

export function ProgressIndicator({
  current,
  total,
  label,
  showPercentage = false,
  variant = 'default',
  className = '',
  'data-testid': testId = 'progress-indicator',
}: ProgressIndicatorProps) {
  // Calculate progress percentage (0-100)
  const progress = total > 0 ? Math.min(Math.max((current / total) * 100, 0), 100) : 0;
  const isComplete = current >= total;

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'w-32';
      case 'minimal':
        return 'w-24';
      default:
        return 'w-full';
    }
  };

  // Generate aria label
  const getAriaLabel = () => {
    const baseLabel = label ? `${label} - ` : '';
    return `Progress: ${baseLabel}Step ${current} of ${total}`;
  };

  return (
    <div
      className={`${getVariantClasses()} ${className}`.trim()}
      data-testid={testId}
    >
      {/* Label and Step Counter */}
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {label && (
            <span className="font-medium text-gray-700">
              {label}
            </span>
          )}
          <span className="text-gray-500">
            Step {current} of {total}
          </span>
        </div>
        
        {showPercentage && (
          <span className="font-medium text-gray-600">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={getAriaLabel()}
        />
      </div>

      {/* Completion Indicator */}
      {isComplete && (
        <div className="mt-1 text-xs text-green-600">
          ✓ Complete
        </div>
      )}
    </div>
  );
}
