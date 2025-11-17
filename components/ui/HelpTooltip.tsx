// src/components/ui/HelpTooltip.tsx
'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { HelpTooltipProps, HelpTooltipComponent } from '../HelpTooltip.interface';

export const HelpTooltip = forwardRef<HelpTooltipComponent, HelpTooltipProps>(({
  content,
  position = 'top',
  maxWidth = '250px',
  className = '',
  'data-testid': testId = 'help-tooltip',
  disabled = false,
}, ref) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    show: () => setOpen(true),
    hide: () => setOpen(false),
    toggle: () => setOpen(prev => !prev),
  }));

  const handleMouseEnter = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  const handleFocus = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button
            ref={buttonRef}
            className={`
              inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 rounded-full border border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${className}
            `.trim()}
            aria-label="Help"
            disabled={disabled}
            data-testid={testId}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 0C2.686 0 0 2.686 0 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 9c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1zm1-3H5V3h2v3z"
                fill="currentColor"
              />
            </svg>
          </button>
        </Tooltip.Trigger>
        
        <Tooltip.Portal>
          <Tooltip.Content
            side={position}
            className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-xl z-50 max-w-none"
            style={{ maxWidth }}
            sideOffset={5}
            onKeyDown={handleKeyDown}
          >
            {content}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});

HelpTooltip.displayName = 'HelpTooltip';
