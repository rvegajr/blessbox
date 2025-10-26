'use client';

import { TutorialButton } from '@/components/ui/TutorialButton';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { EmptyState } from '@/components/ui/EmptyState';
import { TUTORIALS } from '@/lib/tutorials';
import { useTutorial } from '@/hooks/useTutorial';
import { useState } from 'react';

export default function TutorialDemoPage() {
  const { startTutorial, resetAllTutorials } = useTutorial();
  const [showEmptyState, setShowEmptyState] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tutorial System Demo
          </h1>
          <p className="text-gray-600">
            This page demonstrates all the tutorial components in action.
          </p>
        </div>

        {/* Demo Sections */}
        <div className="space-y-8">

          {/* Tutorial Button Demo */}
          <section className="bg-white rounded-lg shadow p-6" id="tutorial-buttons">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Tutorial Buttons
              <HelpTooltip
                content="These buttons trigger interactive step-by-step tours"
                position="right"
              />
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Icon Variant (Floating):</p>
                <div className="relative h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300">
                  <div className="absolute bottom-4 right-4">
                    <TutorialButton
                      tutorial={TUTORIALS.dashboard}
                      variant="icon"
                    />
                  </div>
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Look at the bottom-right corner →
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Button Variant:</p>
                <TutorialButton
                  tutorial={TUTORIALS.dashboard}
                  variant="button"
                />
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Link Variant:</p>
                <TutorialButton
                  tutorial={TUTORIALS.dashboard}
                  variant="link"
                />
              </div>
            </div>
          </section>

          {/* Help Tooltip Demo */}
          <section className="bg-white rounded-lg shadow p-6" id="help-tooltips">
            <h2 className="text-xl font-semibold mb-4">Help Tooltips</h2>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                  <HelpTooltip
                    content="This name will appear on all your registration forms and QR codes"
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  placeholder="Enter organization name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  Email Address
                  <HelpTooltip
                    content="We'll send verification codes to this email"
                    position="right"
                  />
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  Tooltip Positions
                </label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    Top
                    <HelpTooltip content="Position: top" position="top" />
                  </div>
                  <div className="flex items-center gap-2">
                    Right
                    <HelpTooltip content="Position: right" position="right" />
                  </div>
                  <div className="flex items-center gap-2">
                    Bottom
                    <HelpTooltip content="Position: bottom" position="bottom" />
                  </div>
                  <div className="flex items-center gap-2">
                    Left
                    <HelpTooltip content="Position: left" position="left" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Empty State Demo */}
          <section className="bg-white rounded-lg shadow p-6" id="empty-states">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Empty States
              <HelpTooltip
                content="These appear when there's no data, guiding users to take action"
                position="right"
              />
            </h2>

            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setShowEmptyState(!showEmptyState)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
                >
                  {showEmptyState ? 'Hide' : 'Show'} Empty State
                </button>

                {showEmptyState && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg">
                    <EmptyState
                      icon={
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                      title="No QR Codes Yet"
                      description="Create your first QR code to start collecting registrations. It only takes a minute!"
                      action={{
                        label: "Create QR Code",
                        onClick: () => alert('This would navigate to QR code creation')
                      }}
                      secondaryAction={{
                        label: "Watch Tutorial",
                        onClick: () => startTutorial(TUTORIALS.qrConfiguration)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Interactive Tutorial Demo */}
          <section className="bg-white rounded-lg shadow p-6" id="interactive-demo">
            <h2 className="text-xl font-semibold mb-4">Interactive Tutorial Demo</h2>

            <div className="space-y-4">
              <p className="text-gray-600">
                These sections have IDs that tutorials can highlight:
              </p>

              <div id="demo-section-1" className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium text-blue-900">Section 1</h3>
                <p className="text-sm text-blue-700">This section has id="demo-section-1"</p>
              </div>

              <div id="demo-section-2" className="p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-medium text-green-900">Section 2</h3>
                <p className="text-sm text-green-700">This section has id="demo-section-2"</p>
              </div>

              <div id="demo-section-3" className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h3 className="font-medium text-purple-900">Section 3</h3>
                <p className="text-sm text-purple-700">This section has id="demo-section-3"</p>
              </div>

              <button
                onClick={() => startTutorial({
                  id: 'demo',
                  name: 'Demo Tutorial',
                  steps: [
                    {
                      element: '#demo-section-1',
                      popover: {
                        title: 'First Section',
                        description: 'This is the first section we want to highlight in our tutorial.',
                        side: 'bottom',
                      },
                    },
                    {
                      element: '#demo-section-2',
                      popover: {
                        title: 'Second Section',
                        description: 'Here we show the second important feature.',
                        side: 'bottom',
                      },
                    },
                    {
                      element: '#demo-section-3',
                      popover: {
                        title: 'Third Section',
                        description: 'And finally, we wrap up with this section. You can have as many steps as you need!',
                        side: 'top',
                      },
                    },
                  ],
                })}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Start Demo Tutorial
              </button>
            </div>
          </section>

          {/* Pre-built Tutorials */}
          <section className="bg-white rounded-lg shadow p-6" id="prebuilt-tutorials">
            <h2 className="text-xl font-semibold mb-4">Pre-built Tutorials</h2>

            <p className="text-gray-600 mb-4">
              These tutorials are ready to use on their respective pages:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(TUTORIALS).map(([key, tutorial]) => (
                <div key={key} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{tutorial.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {tutorial.steps.length} steps • ID: {tutorial.id}
                  </p>
                  <button
                    onClick={() => {
                      alert(
                        `This tutorial is designed for the ${tutorial.name} page.\n\n` +
                        `To use it:\n` +
                        `1. Add IDs to page elements\n` +
                        `2. Add TutorialButton to the page\n` +
                        `3. Pass TUTORIALS.${key}\n\n` +
                        `See TUTORIAL_IMPLEMENTATION_GUIDE.md for details.`
                      );
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Utilities */}
          <section className="bg-white rounded-lg shadow p-6" id="utilities">
            <h2 className="text-xl font-semibold mb-4">Utilities</h2>

            <div className="space-y-2">
              <button
                onClick={resetAllTutorials}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Reset All Tutorials
              </button>
              <p className="text-sm text-gray-600">
                Clear tutorial state from localStorage. Tutorials will show again.
              </p>
            </div>
          </section>

          {/* Documentation Links */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Documentation</h2>

            <div className="space-y-2">
              <a
                href="/GETTING_STARTED_CHECKLIST.md"
                className="block text-blue-600 hover:text-blue-700 font-medium"
                target="_blank"
              >
                📋 Getting Started Checklist →
              </a>
              <a
                href="/DOCUMENTATION_README.md"
                className="block text-blue-600 hover:text-blue-700 font-medium"
                target="_blank"
              >
                📖 Complete Documentation →
              </a>
              <a
                href="/TUTORIAL_IMPLEMENTATION_GUIDE.md"
                className="block text-blue-600 hover:text-blue-700 font-medium"
                target="_blank"
              >
                🔧 Implementation Guide →
              </a>
              <a
                href="/USER_QUICK_START.md"
                className="block text-blue-600 hover:text-blue-700 font-medium"
                target="_blank"
              >
                👥 User Quick Start →
              </a>
            </div>
          </section>

        </div>
      </div>

      {/* Floating Tutorial Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <TutorialButton
          tutorial={{
            id: 'demo-page',
            name: 'Demo Page Tour',
            steps: [
              {
                element: '#tutorial-buttons',
                popover: {
                  title: 'Tutorial Buttons',
                  description: 'These trigger interactive tours. Try clicking them!',
                  side: 'bottom',
                },
              },
              {
                element: '#help-tooltips',
                popover: {
                  title: 'Help Tooltips',
                  description: 'Hover over the ? icons to see contextual help.',
                  side: 'bottom',
                },
              },
              {
                element: '#empty-states',
                popover: {
                  title: 'Empty States',
                  description: 'These guide users when there\'s no data yet.',
                  side: 'bottom',
                },
              },
              {
                element: '#interactive-demo',
                popover: {
                  title: 'Interactive Demo',
                  description: 'Click the green button to see a custom tutorial in action!',
                  side: 'top',
                },
              },
            ],
          }}
          variant="icon"
        />
      </div>
    </div>
  );
}
