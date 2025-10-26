'use client';

import { useTutorial, Tutorial } from '@/hooks/useTutorial';
import { useState } from 'react';

interface TutorialButtonProps {
  tutorial: Tutorial;
  variant?: 'icon' | 'button' | 'link';
  className?: string;
}

export function TutorialButton({ tutorial, variant = 'button', className = '' }: TutorialButtonProps) {
  const { startTutorial } = useTutorial();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    startTutorial(tutorial);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl ${className}`}
        aria-label="Start Tutorial"
        title="Start Tutorial"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className={`text-blue-600 hover:text-blue-700 underline text-sm ${className}`}
      >
        Start Tutorial
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Start Tutorial
    </button>
  );
}
