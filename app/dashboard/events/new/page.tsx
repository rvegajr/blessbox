"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';
import type { EventType } from '@/lib/interfaces/IEventTypeService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string; description: string }[] = [
  {
    value: 'food_distribution',
    label: 'Food Distribution',
    description: 'Organize food pantry visits with family size tracking',
  },
  {
    value: 'seminar',
    label: 'Seminar Registration',
    description: 'Collect attendee information for seminars and workshops',
  },
  {
    value: 'volunteer',
    label: 'Volunteer Sign-up',
    description: 'Recruit and track volunteer participation',
  },
  {
    value: 'custom',
    label: 'Custom Event',
    description: 'Build your own registration form from scratch',
  },
];

export default function NewEventPage() {
  const router = useRouter();
  const { activeOrganizationId, ready } = useRequireActiveOrganization();
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState<EventType>('food_distribution');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ready || !activeOrganizationId) {
      setError('Organization not found');
      return;
    }

    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: activeOrganizationId,
          name: name.trim(),
          eventType,
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const data = await response.json();
      
      // Redirect to the new event's detail page
      router.push(`/dashboard/events/${data.event.id}`);
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setLoading(false);
    }
  }, [ready, activeOrganizationId, name, eventType, description, router]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-new-event">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
            data-testid="btn-back"
          >
            ← Back to Events
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-1">
            Set up a new event with registration forms and QR codes
          </p>
        </div>

        <form onSubmit={handleSubmit} data-testid="form-new-event" className="space-y-6">
          {/* Event Type Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-3">
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVENT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEventType(option.value)}
                  data-testid={`btn-event-type-${option.value}`}
                  className={`text-left p-4 border-2 rounded-lg transition-all ${
                    eventType === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Event Name */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-2">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              id="event-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Food Distribution"
              data-testid="input-event-name"
              required
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this event"
              data-testid="input-event-description"
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length} / 1000 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong> A registration form will be automatically created with fields appropriate for your event type. You can customize the form and generate QR codes after creating the event.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="error-new-event" role="alert">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-submit-new-event"
              data-loading={loading}
              disabled={loading || !name.trim()}
              className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
