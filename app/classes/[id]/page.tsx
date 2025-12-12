'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ClassRecord {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  capacity: number;
  timezone: string;
  status: string;
  created_at: string;
}

interface SessionRecord {
  id: string;
  class_id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  location?: string;
  instructor_name?: string;
  status: string;
}

interface ParticipantRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface EnrollmentRecord {
  id: string;
  participant_id: string;
  class_id: string;
  session_id?: string;
  enrollment_status: string;
  enrolled_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const classId = params.id as string;

  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollForm, setEnrollForm] = useState<{ participant_id: string; session_id: string }>({
    participant_id: '',
    session_id: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, classId]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classRes, sessionsRes, participantsRes, enrollmentsRes] = await Promise.all([
        fetch(`/api/classes/${classId}`),
        fetch(`/api/classes/${classId}/sessions`),
        fetch('/api/participants'),
        fetch(`/api/enrollments?classId=${encodeURIComponent(classId)}`),
      ]);

      if (!classRes.ok) throw new Error('Failed to load class');
      const clsData = await classRes.json();
      setCls(clsData);

      setSessions(sessionsRes.ok ? await sessionsRes.json() : []);
      setParticipants(participantsRes.ok ? await participantsRes.json() : []);

      if (enrollmentsRes.ok) {
        const e = await enrollmentsRes.json();
        setEnrollments(e?.data || []);
      } else {
        setEnrollments([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load class');
    } finally {
      setLoading(false);
    }
  };

  const rosterCount = useMemo(() => enrollments.filter((e) => e.enrollment_status !== 'cancelled').length, [enrollments]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);
    setEnrollError(null);
    try {
      if (!enrollForm.participant_id) {
        throw new Error('Please select a participant');
      }
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: enrollForm.participant_id,
          class_id: classId,
          session_id: enrollForm.session_id || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to enroll participant');
      await loadAll();
      setEnrollForm({ participant_id: '', session_id: '' });
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Failed to enroll participant');
    } finally {
      setEnrolling(false);
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

  if (error || !cls) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error || 'Not found'}</div>
          <div className="mt-4">
            <Link href="/classes" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/classes" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              ← Back to Classes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{cls.name}</h1>
            {cls.description && <p className="text-gray-600 mt-2">{cls.description}</p>}
          </div>
          <Link
            href={`/classes/${classId}/sessions`}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Manage Sessions
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="text-2xl font-bold text-gray-900">{cls.capacity}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Timezone</p>
            <p className="text-2xl font-bold text-gray-900">{cls.timezone}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Enrolled</p>
            <p className="text-2xl font-bold text-gray-900">
              {rosterCount} / {cls.capacity}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enroll Participant</h2>
          {enrollError && <div className="mb-4 text-sm text-red-600">{enrollError}</div>}
          <form onSubmit={handleEnroll} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Participant</label>
              <select
                value={enrollForm.participant_id}
                onChange={(e) => setEnrollForm((p) => ({ ...p, participant_id: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select participant</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.email})
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-gray-500">
                Need someone new? <Link href="/participants/new" className="text-blue-600 hover:underline">Add participant</Link>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session (optional)</label>
              <select
                value={enrollForm.session_id}
                onChange={(e) => setEnrollForm((p) => ({ ...p, session_id: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">No specific session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_date} {s.session_time} ({s.duration_minutes}m)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={enrolling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {enrolling ? 'Enrolling...' : 'Enroll'}
            </button>
          </form>
          {cls.capacity > 0 && rosterCount >= cls.capacity && (
            <p className="mt-3 text-sm text-yellow-700">Capacity limit reached. Further enrollments should be blocked.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Roster</h2>
            <span className="text-sm text-gray-600">{enrollments.length} total</span>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-10 text-gray-600">No enrollments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {e.first_name ? `${e.first_name} ${e.last_name}` : e.participant_id}
                        {e.email && <span className="text-gray-500 font-normal"> — {e.email}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.enrollment_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {e.enrolled_at ? new Date(e.enrolled_at).toLocaleString() : '—'}
                      </td>
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

