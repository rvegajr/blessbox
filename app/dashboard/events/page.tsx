"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';
import type { Event } from '@/lib/interfaces/IEventService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const EVENT_TYPE_LABELS: Record<string, string> = {
  food_distribution: 'Food Distribution',
  seminar: 'Seminar',
  volunteer: 'Volunteer',
  custom: 'Custom Event',
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  food_distribution: '🍞',
  seminar: '🎤',
  volunteer: '🤝',
  custom: '📋',
};

function EventCard({ event }: { event: Event }) {
  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType || 'custom'] || 'Event';
  const eventTypeIcon = EVENT_TYPE_ICONS[event.eventType || 'custom'] || '📋';
  const statusColor = event.isActive ? 'text-green-600' : 'text-gray-400';
  const statusLabel = event.isActive ? 'Active' : 'Inactive';

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      data-testid={`card-event-${event.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-label={`${eventTypeLabel} icon`}>
            {eventTypeIcon}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
            <p className="text-sm text-gray-500">{eventTypeLabel}</p>
          </div>
        </div>
        <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
      </div>

      {event.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
      )}

      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div>
          <span className="font-semibold text-gray-900">{event.registrationCount}</span>
          {' registrations'}
        </div>
        <div>
          <span className="font-semibold text-gray-900">{event.qrCodes.length}</span>
          {' QR codes'}
        </div>
        <div className="text-xs text-gray-400">
          Created {new Date(event.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const { activeOrganizationId, ready } = useRequireActiveOrganization();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!ready || !activeOrganizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events?organizationId=${activeOrganizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [ready, activeOrganizationId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-1">
              Manage your organization's events and registrations
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            data-testid="btn-new-event"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + New Event
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8" data-testid="loading-events" data-loading="true">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading events...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="error-events" role="alert">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadEvents}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center" data-testid="empty-events">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first event
            </p>
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
