'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SessionRecord {
  id: string;
  class_id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  location?: string;
  instructor_name?: string;
  status: string;
  created_at: string;
}

export default function ClassSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const classId = params.id as string;

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    session_date: '',
    session_time: '',
    duration_minutes: 60,
    location: '',
    instructor_name: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, classId]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/sessions`);
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create session');
      setForm({ session_date: '', session_time: '', duration_minutes: 60, location: '', instructor_name: '' });
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href={`/classes/${classId}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            ← Back to Class
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Class Sessions</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Session</h2>
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="session_date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                id="session_date"
                type="date"
                value={form.session_date}
                onChange={(e) => setForm((p) => ({ ...p, session_date: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="session_time" className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                id="session_time"
                type="time"
                value={form.session_time}
                onChange={(e) => setForm((p) => ({ ...p, session_time: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                value={form.duration_minutes}
                onChange={(e) => setForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
              <input
                value={form.instructor_name}
                onChange={(e) => setForm((p) => ({ ...p, instructor_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Sessions</h2>
            <button onClick={fetchSessions} className="text-sm text-blue-600 hover:underline">
              Refresh
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-600">No sessions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.session_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.session_time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.duration_minutes}m</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.location || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.instructor_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

