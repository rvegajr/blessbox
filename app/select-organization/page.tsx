import { Suspense } from 'react';
import SelectOrganizationClient from './select-organization-client';

export default function SelectOrganizationPage() {
  // Next.js requires useSearchParams()-using components to be wrapped in Suspense.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
              <div className="text-gray-600">Loading…</div>
            </div>
          </div>
        </div>
      }
    >
      <SelectOrganizationClient />
    </Suspense>
  );
}

