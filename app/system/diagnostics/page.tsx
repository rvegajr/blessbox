import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DiagnosticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System diagnostics</h1>
        <p className="text-gray-600 mb-8">
          Quick checks for production readiness. (Most endpoints require authorization in production.)
        </p>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Health</h2>
            <p className="text-sm text-gray-600 mb-3">Basic DB + app connectivity.</p>
            <code className="block text-sm bg-gray-50 border border-gray-200 rounded p-3">
              GET /api/system/health-check
            </code>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Email</h2>
            <p className="text-sm text-gray-600 mb-3">
              Provider config + template readiness (optionally per-org).
            </p>
            <code className="block text-sm bg-gray-50 border border-gray-200 rounded p-3">
              GET /api/system/email-health?orgId=&lt;org-id&gt;
            </code>
            <code className="block text-sm bg-gray-50 border border-gray-200 rounded p-3 mt-2">
              POST /api/system/email-health {'{'}"orgId","to","templateType? "{'}'}
            </code>
          </div>

          <div className="text-sm text-gray-500">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

