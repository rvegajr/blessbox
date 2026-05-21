"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';
import type { Event } from '@/lib/interfaces/IEventService';
import type { QRCode } from '@/lib/interfaces/IQRCodeService';

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

function QRCodeCard({ qrCode }: { qrCode: QRCode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid={`card-qr-${qrCode.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{qrCode.description || qrCode.label}</h4>
          <p className="text-sm text-gray-500">{qrCode.label}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${qrCode.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {qrCode.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {qrCode.dataUrl && (
        <img
          src={qrCode.dataUrl}
          alt={`QR code for ${qrCode.label}`}
          className="w-32 h-32 border border-gray-200 rounded mb-3"
        />
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div>
          <span className="font-semibold text-gray-900">{qrCode.registrationCount}</span>
          {' registrations'}
        </div>
        <div>
          <span className="font-semibold text-gray-900">{qrCode.scanCount}</span>
          {' scans'}
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const { ready } = useRequireActiveOrganization();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const loadEvent = useCallback(async () => {
    if (!ready || !eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error('Failed to load event');
      }

      const data = await response.json();
      setEvent(data.event);
      setEditForm({
        name: data.event.name,
        description: data.event.description || '',
      });
    } catch (err) {
      console.error('Failed to load event:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [ready, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleUpdate = useCallback(async () => {
    if (!event) return;

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const data = await response.json();
      setEvent(data.event);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update event:', err);
      alert(err instanceof Error ? err.message : 'Failed to update event');
    }
  }, [event, editForm]);

  const handleDelete = useCallback(async () => {
    if (!event) return;
    
    if (!confirm(`Are you sure you want to delete "${event.name}"? This will make it inactive but preserve all data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      router.push('/dashboard/events');
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  }, [event, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="loading-event" data-loading="true">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading event...</span>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="error-event">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Event not found'}</p>
            <button
              onClick={() => router.push('/dashboard/events')}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType || 'custom'] || 'Event';
  const eventTypeIcon = EVENT_TYPE_ICONS[event.eventType || 'custom'] || '📋';

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-event-detail">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/dashboard/events')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          data-testid="btn-back"
        >
          ← Back to Events
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{eventTypeIcon}</span>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 mb-2"
                    data-testid="input-edit-name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{event.name}</h1>
                )}
                <p className="text-sm text-gray-500">{eventTypeLabel}</p>
              </div>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {event.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {isEditing ? (
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Event description"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              data-testid="input-edit-description"
            />
          ) : event.description ? (
            <p className="text-gray-600 mb-4">{event.description}</p>
          ) : null}

          <div className="flex items-center gap-6 mb-6">
            <div className="text-sm">
              <span className="text-2xl font-bold text-gray-900 block">{event.registrationCount}</span>
              <span className="text-gray-600">Registrations</span>
            </div>
            <div className="text-sm">
              <span className="text-2xl font-bold text-gray-900 block">{event.qrCodes.length}</span>
              <span className="text-gray-600">QR Codes</span>
            </div>
            <div className="text-sm">
              <span className="text-xs text-gray-400 block">Created</span>
              <span className="text-gray-900">{new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  data-testid="btn-save-event"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({ name: event.name, description: event.description || '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  data-testid="btn-edit-event"
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md"
                >
                  Edit Event
                </button>
                <Link
                  href={`/dashboard/registrations?eventId=${event.id}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
                >
                  View Registrations
                </Link>
                <button
                  onClick={handleDelete}
                  data-testid="btn-delete-event"
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 rounded-md"
                >
                  Delete Event
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Codes</h2>
          {event.qrCodes.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center" data-testid="empty-qr-codes">
              <p className="text-gray-600">No QR codes generated yet for this event.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.qrCodes.map((qr) => (
                <QRCodeCard key={qr.id} qrCode={qr} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
