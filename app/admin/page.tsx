"use client";

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.status === 403) {
        setError('Forbidden (super admin only)');
        setSubs([]);
      } else {
        const data = await res.json();
        setSubs(data.subscriptions || []);
      }
    } catch (e) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(subscriptionId: string) {
    await fetch('/api/admin/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });
    await load();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Super Admin</h1>
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Org</th>
                  <th className="text-left p-2 border">Email</th>
                  <th className="text-left p-2 border">Plan</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Billing</th>
                  <th className="text-left p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 border">{s.organization_name || '-'}</td>
                    <td className="p-2 border">{s.contact_email}</td>
                    <td className="p-2 border uppercase">{s.plan_type}</td>
                    <td className="p-2 border">{s.status}</td>
                    <td className="p-2 border">{s.billing_cycle}</td>
                    <td className="p-2 border">
                      {s.status === 'active' ? (
                        <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => cancel(String(s.id))}>
                          Cancel
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

