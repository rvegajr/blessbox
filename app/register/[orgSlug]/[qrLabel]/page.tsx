'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function RegistrationForm({ orgSlug, qrLabel, sketId }: { orgSlug: string; qrLabel: string; sketId?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Form</h1>
          <div className="space-y-4 text-left">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Registration Details:</h3>
              <p><strong>Organization:</strong> {orgSlug}</p>
              <p><strong>QR Label:</strong> {qrLabel}</p>
              {sketId && <p><strong>SketId:</strong> {sketId}</p>}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input 
                  type="text" 
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  placeholder="Enter your phone number"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Size
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">Select family size</option>
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4 people</option>
                  <option value="5">5+ people</option>
                </select>
              </div>
            </div>
            
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold">
              Submit Registration
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Already registered?{' '}
                <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  Go Home
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationPageContent({ params }: { params: Promise<{ orgSlug: string; qrLabel: string }> }) {
  const searchParams = useSearchParams();
  const sketId = searchParams.get('sketId') || undefined;
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string; qrLabel: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm 
      orgSlug={resolvedParams.orgSlug} 
      qrLabel={resolvedParams.qrLabel} 
      sketId={sketId}
    />
  );
}

export default function RegistrationPage({ params }: { params: Promise<{ orgSlug: string; qrLabel: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <RegistrationPageContent params={params} />
    </Suspense>
  );
}
