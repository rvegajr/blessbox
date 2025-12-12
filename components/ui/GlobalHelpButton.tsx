/**
 * GlobalHelpButton Component
 * Floating help button that opens a help drawer with tutorials and quick links
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GlobalHelpButtonProps } from '../GlobalHelpButton.interface';

// Tutorial definitions
const AVAILABLE_TUTORIALS = [
  { id: 'welcome-tour', name: 'Welcome Tour', description: 'Get started with BlessBox' },
  { id: 'dashboard-tour', name: 'Dashboard Tour', description: 'Learn about your dashboard' },
  { id: 'qr-creation-tour', name: 'QR Creation Tour', description: 'Create your first QR code' },
  { id: 'event-management-tour', name: 'Event Management Tour', description: 'Manage your events' },
  { id: 'team-management-tour', name: 'Team Management Tour', description: 'Invite and manage team members' },
];

export function GlobalHelpButton({
  className = '',
  'data-testid': testId = 'global-help-button',
  position = 'bottom-right',
  customTutorials,
  show = true,
}: GlobalHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get tutorials to display
  const tutorials = customTutorials || AVAILABLE_TUTORIALS;

  // Check if tutorial system is available
  const tutorialSystem = typeof window !== 'undefined' 
    ? (window as any).BlessBoxTutorialSystem 
    : null;

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Handle opening drawer
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    // Check context triggers when opening
    if (tutorialSystem?.checkContextTriggers) {
      tutorialSystem.checkContextTriggers();
    }
  }, [tutorialSystem]);

  // Handle closing drawer
  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Return focus to button
    buttonRef.current?.focus();
  }, []);

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleOpen, handleClose]);

  // Handle starting a tutorial
  const handleStartTutorial = useCallback((tutorialId: string) => {
    if (tutorialSystem?.startTutorial) {
      tutorialSystem.startTutorial(tutorialId);
      handleClose();
    }
  }, [tutorialSystem, handleClose]);

  // Check if tutorial is completed
  const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
    if (tutorialSystem?.isTutorialCompleted) {
      return tutorialSystem.isTutorialCompleted(tutorialId, 1);
    }
    return false;
  }, [tutorialSystem]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Trap focus within drawer
      const drawer = drawerRef.current;
      if (drawer) {
        const focusableElements = drawer.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        };

        document.addEventListener('keydown', handleTab);
        firstElement?.focus();

        return () => {
          document.removeEventListener('keydown', handleTab);
        };
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!show) {
    return null;
  }

  return (
    <>
      {/* Help Button */}
      <div
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        data-testid={testId}
      >
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Open help"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          data-testid="help-drawer-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Help Drawer */}
      {isOpen && (
        <div
          ref={drawerRef}
          data-testid="help-drawer"
          role="dialog"
          aria-labelledby="help-drawer-title"
          aria-modal="true"
          aria-live="polite"
          className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2
                id="help-drawer-title"
                className="text-2xl font-bold text-gray-900"
              >
                Help & Support
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close help"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6">
              {/* Tutorials Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tutorials
                </h3>
                <div className="space-y-3">
                  {tutorials.map((tutorial) => {
                    const completed = isTutorialCompleted(tutorial.id);
                    return (
                      <button
                        key={tutorial.id}
                        onClick={() => handleStartTutorial(tutorial.id)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {tutorial.name}
                              {completed && (
                                <span className="ml-2 text-xs text-green-600 font-normal">
                                  (Completed)
                                </span>
                              )}
                            </div>
                            {tutorial.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {tutorial.description}
                              </div>
                            )}
                          </div>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-gray-400"
                            aria-hidden="true"
                          >
                            <path
                              d="M7 15l5-5-5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick Links Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="/dashboard"
                    className="block p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="mailto:support@blessbox.org"
                    className="block p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    Contact Support
                  </a>
                  <a
                    href="/pricing"
                    className="block p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    Pricing & Plans
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

