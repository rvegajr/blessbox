"use client";

import { useRouter } from 'next/navigation';

const plans = [
  { key: 'free', name: 'Free Plan', price: 0, features: ['Up to 100 registrations'] },
  { key: 'standard', name: 'Standard Plan', price: 19, features: ['Up to 5,000 registrations', 'Email support'] },
  { key: 'enterprise', name: 'Enterprise Plan', price: 99, features: ['Up to 50,000 registrations', 'Priority support'] },
] as const;

export default function PricingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Pricing</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.key} className="border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-3xl font-bold mt-2">{p.price === 0 ? 'Free' : `$${p.price}/mo`}</p>
              <ul className="mt-4 text-sm text-gray-600 list-disc pl-5">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className="mt-6 w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
                onClick={() => router.push(`/checkout?plan=${p.key}`)}
              >
                {p.price === 0 ? 'Get Started' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

