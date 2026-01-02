'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * System admin page to clear production database
 * TEMPORARY: Remove before final production launch
 */
export default function ClearDatabasePage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = async () => {
    if (confirmText !== 'CLEAR DATABASE') {
      setError('You must type "CLEAR DATABASE" to confirm');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/system/clear-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSuccess(true);
      setResult(data);
      setShowConfirm(false);
      setConfirmText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-500">
        {/* Warning Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            DANGER ZONE
          </h1>
          <p className="text-gray-600">
            System Administration: Database Clear
          </p>
        </div>

        {/* Environment Badge */}
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <p className="text-sm font-mono text-yellow-800 text-center">
            Environment: <strong>{process.env.NODE_ENV || 'development'}</strong>
          </p>
          <p className="text-xs text-yellow-600 text-center mt-1">
            This page should be removed before final production launch
          </p>
        </div>

        {/* Secret Input */}
        {!showConfirm && (
          <div className="mb-6">
            <label
              htmlFor="secret"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              DIAGNOSTICS_SECRET
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter diagnostics secret"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none font-mono"
              data-testid="input-diagnostics-secret"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Required in production. Get from Vercel environment variables.
            </p>
          </div>
        )}

        {/* Confirmation Section */}
        {showConfirm && !success && (
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-lg">
            <h3 className="text-lg font-bold text-red-700 mb-3">
              ⚠️ FINAL CONFIRMATION
            </h3>
            <p className="text-red-600 mb-4 font-medium">
              This will DELETE ALL data except the super admin account!
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Type <strong>CLEAR DATABASE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CLEAR DATABASE"
                className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:border-red-600 focus:outline-none font-mono"
                data-testid="input-confirm-text"
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                disabled={loading || confirmText !== 'CLEAR DATABASE'}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition-colors"
                data-testid="btn-execute-clear"
              >
                {loading ? 'Clearing...' : 'EXECUTE CLEAR'}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                disabled={loading}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                data-testid="btn-cancel-clear"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Initial Clear Button */}
        {!showConfirm && !success && (
          <button
            onClick={() => {
              if (!secret) {
                setError('Please enter DIAGNOSTICS_SECRET first');
                return;
              }
              setError(null);
              setShowConfirm(true);
            }}
            disabled={loading || !secret}
            className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg transition-colors"
            data-testid="btn-clear-database"
          >
            Clear Production Database
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div
            className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg"
            data-testid="error-clear-database"
          >
            <p className="text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && result && (
          <div
            className="mt-4 p-6 bg-green-50 border-2 border-green-300 rounded-lg"
            data-testid="success-clear-database"
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-green-700">
                Database Cleared Successfully
              </h3>
            </div>
            
            <div className="bg-white p-4 rounded border border-green-200 mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Deleted:</h4>
              <ul className="text-sm text-gray-600 space-y-1 font-mono">
                <li>Organizations: {result.deleted.organizations}</li>
                <li>Users: {result.deleted.users}</li>
                <li>Registrations: {result.deleted.registrations}</li>
                <li>QR Code Sets: {result.deleted.qrCodeSets}</li>
                <li>Memberships: {result.deleted.memberships}</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded border border-green-200">
              <h4 className="font-semibold text-gray-700 mb-2">Remaining:</h4>
              <ul className="text-sm text-gray-600 space-y-1 font-mono">
                <li>Organizations: {result.remaining.organizations}</li>
                <li>Users: {result.remaining.users} (super admin)</li>
                <li>Registrations: {result.remaining.registrations}</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              data-testid="btn-return-home"
            >
              Return to Home
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm">
            ℹ️ Usage Notes:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• This endpoint is protected by DIAGNOSTICS_SECRET in production</li>
            <li>• Super admin account (admin@blessbox.app) is preserved</li>
            <li>• All organizations, users, and registrations are deleted</li>
            <li>• This page should be removed before final production launch</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

