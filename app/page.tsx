'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering for client-side interactivity
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState<'available' | 'taken' | null>(null);

  useEffect(() => {
    // Initialize AOS
    if (typeof window !== 'undefined') {
      import('aos').then((AOS) => {
        AOS.default.init({
          duration: 800,
          once: true,
          mirror: false,
        });
      });
    }
  }, []);

  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (value.length > 0) {
      // Always show as available for demo purposes
      setDomainStatus('available');
    } else {
      setDomainStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Header */}
        <section id="welcome-section" className="py-12" data-tutorial-target="welcome-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-black text-6xl md:text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 bg-clip-text text-transparent" style={{ 
                WebkitTextStroke: '2px rgb(30, 64, 175)',
                filter: 'drop-shadow(0 4px 6px rgba(30, 64, 175, 0.15))'
              }}>
                BlessBox
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Streamlined QR-based registration and verification system for organizations
              </p>
            </div>
          </div>
        </section>

        {/* Main 4-Panel Grid */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              
              {/* Panel 1: Organization Login/Registration */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-shadow duration-200 [box-shadow:0_20px_25px_-5px_rgba(59,130,246,0.1),0_8px_10px_-6px_rgba(59,130,246,0.1)] hover:[box-shadow:0_25px_50px_-12px_rgba(59,130,246,0.15),0_10px_15px_-8px_rgba(59,130,246,0.1)]">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">1. Organization Setup</h2>
                </div>
                
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Register Your Organization</h3>
                  <p className="text-gray-600 mb-6">Create an account for your organization to manage registrations</p>
                  
                  <div className="space-y-4">
                    {/* Organization Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Food Bank Central" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm focus:shadow-md"
                      />
                    </div>

                    {/* Event Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Weekly Food Distribution" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm focus:shadow-md"
                      />
                    </div>

                    {/* Custom Domain Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Custom Domain</label>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">{domain.length}/255</span>
                        {domainStatus && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-green-600">Domain available!</span>
                          </div>
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">blessbox.org/</span>
                        <input 
                          type="text" 
                          placeholder="yourname" 
                          value={domain}
                          onChange={(e) => handleDomainChange(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm focus:shadow-md"
                          maxLength={255}
                        />
                      </div>
                    </div>
                    
                    <button id="create-org-btn" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200" disabled>
                      Sign Up
                    </button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Already have an account?
                        <a href="/dashboard" id="dashboard-link" className="text-blue-600 hover:text-blue-500 font-medium ml-1">Login</a>
                      </p>
                    </div>
                  </div>
                </div>
                
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm">
                  <p className="text-sm text-blue-800">
                    <strong>Example:</strong> "Food Bank Central" registers to manage food donation distributions
                  </p>
                </div>
              </div>

              {/* Panel 2: QR Code Creation */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-shadow duration-200 [box-shadow:0_20px_25px_-5px_rgba(59,130,246,0.1),0_8px_10px_-6px_rgba(59,130,246,0.1)] hover:[box-shadow:0_25px_50px_-12px_rgba(59,130,246,0.15),0_10px_15px_-8px_rgba(59,130,246,0.1)]">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">2. Create QR Codes</h2>
                </div>
                
                <div className="mb-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code Configuration</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Label <span className="text-blue-600">(Optional)</span></label>
                        <input 
                          type="text" 
                          placeholder="e.g., Main Entrance, Station A, Weekly Distribution"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm focus:shadow-md"
                          maxLength={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">Help staff identify different QR codes for the same event</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm focus:shadow-md">
                          <option>Food Donation</option>
                          <option>Seminar Registration</option>
                          <option>Volunteer Sign-up</option>
                          <option>Custom Event</option>
                        </select>
                      </div>

                      {/* Required Information */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Required Information</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                            <label className="ml-2 text-sm text-gray-700">Name</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                            <label className="ml-2 text-sm text-gray-700">Phone Number</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                            <label className="ml-2 text-sm text-gray-700">Family Size</label>
                          </div>
                        </div>
                      </div>

                      {/* Create Multiple QR Codes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Create Multiple QR Codes</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="radio" name="qr-type" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" defaultChecked />
                            <label className="ml-2 text-sm text-gray-700">Single QR Code</label>
                          </div>
                          <div className="flex items-center">
                            <input type="radio" name="qr-type" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                            <label className="ml-2 text-sm text-gray-700">Multiple QR Codes (for different locations/stations)</label>
                          </div>
                        </div>
                      </div>
                      
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200">
                        Generate QR Code(s)
                      </button>
                    </div>
                  </div>
                </div>
                
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm">
                  <p className="text-sm text-blue-800">
                    <strong>Example:</strong> Create multiple QR codes for "Weekly Food Distribution" - one labeled "Main Entrance" and another "Side Door" - both requiring name, phone, and family size
                  </p>
                </div>
              </div>

              {/* Panel 3: QR Display & Scanning */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-shadow duration-200 [box-shadow:0_20px_25px_-5px_rgba(234,179,8,0.1),0_8px_10px_-6px_rgba(234,179,8,0.1)] hover:[box-shadow:0_25px_50px_-12px_rgba(234,179,8,0.15),0_10px_15px_-8px_rgba(234,179,8,0.1)]">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">3. Display & Scan</h2>
                </div>
                
                <div className="text-center mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm">
                      <div className="w-24 h-24 mx-auto bg-black rounded-lg relative mb-3">
                        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0">
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">Main Entrance</p>
                      <p className="text-xs text-gray-500">Food Distribution QR</p>
                    </div>

                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm">
                      <div className="w-24 h-24 mx-auto bg-black rounded-lg relative mb-3">
                        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0">
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-black"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">Side Door</p>
                      <p className="text-xs text-gray-500">Food Distribution QR</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">Scan with your phone camera • Both QR codes lead to the same registration form</p>

                  {/* Registration Form Preview */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-sm mx-auto shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Registration Form</h4>
                    <div className="space-y-2">
                      <input type="text" placeholder="Full Name" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <input type="tel" placeholder="Phone Number" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <select className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Family Size</option>
                        <option>1-2 people</option>
                        <option>3-4 people</option>
                        <option>5+ people</option>
                      </select>
                      <button className="w-full bg-blue-600 text-white py-1 text-xs rounded hover:bg-blue-700">Submit Registration</button>
                    </div>
                  </div>

                  {/* User Submits Registration */}
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">1</div>
                      <h3 className="text-sm font-semibold text-gray-900">User Submits Registration Form</h3>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3 text-left">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-900">Maria Rodriguez</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Family Size:</span>
                          <span className="text-gray-900">4 members</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Phone:</span>
                          <span className="text-gray-900">(555) 123-4567</span>
                        </div>
                      </div>
                      <button className="w-full bg-green-600 text-white py-1 text-xs rounded mt-2 hover:bg-green-700">🎉 Submit Registration</button>
                    </div>
                  </div>
                </div>
                
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 shadow-sm">
                  <p className="text-sm text-yellow-800">
                    <strong>Example:</strong> Families can scan either QR code (Main Entrance or Side Door), fill out the same form on their phone, and submit registration instantly. Staff can track which entrance was used.
                  </p>
                </div>
              </div>

              {/* Panel 4: QR Magic Demonstration */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-shadow duration-200 [box-shadow:0_20px_25px_-5px_rgba(34,197,94,0.1),0_8px_10px_-6px_rgba(34,197,94,0.1)] hover:[box-shadow:0_25px_50px_-12px_rgba(34,197,94,0.15),0_10px_15px_-8px_rgba(34,197,94,0.1)]">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">4. The QR Magic! ✨</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full shadow-lg transform rotate-3 animate-bounce">
                      <span className="text-sm font-bold">✨ INSTANT MAGIC! ✨</span>
                    </div>
                  </div>

                  {/* Step 1: QR Code Appears */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</div>
                      <h3 className="text-lg font-semibold text-green-800">QR Code Appears Instantly!</h3>
                    </div>
                    
                    <div className="bg-white border border-green-200 rounded p-4 text-center">
                      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3 inline-block mb-3">
                        <div className="w-24 h-24 bg-black relative">
                          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0">
                            <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                            <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                            <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                            <div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div>
                            <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div>
                            <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                            <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                            <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-green-700">📱 User shows this QR code to staff</p>
                        <p className="text-xs text-green-600">Unique check-in token: abc123-def456</p>
                        <p className="text-xs text-orange-600">⚠️ Keep this page open until checked in!</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Staff Scans */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</div>
                      <h3 className="text-lg font-semibold text-blue-800">Organization Worker Scans QR Code</h3>
                    </div>
                    
                    <div className="bg-white border border-blue-200 rounded p-4 text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-blue-700">📱 Staff scans with their phone</p>
                        <p className="text-xs text-blue-600">Instant verification & check-in interface loads</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Ready for Action */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</div>
                      <h3 className="text-lg font-semibold text-purple-800">Ready for Distribution, Action, Attendance!</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-purple-200 rounded p-3 text-center">
                        <div className="text-2xl mb-1">🍎</div>
                        <p className="text-sm font-semibold text-gray-900">Food Distribution</p>
                        <p className="text-xs text-gray-600">Ready to distribute items</p>
                      </div>
                      <div className="bg-white border border-purple-200 rounded p-3 text-center">
                        <div className="text-2xl mb-1">📋</div>
                        <p className="text-sm font-semibold text-gray-900">Event Check-In</p>
                        <p className="text-xs text-gray-600">Attendance confirmed</p>
                      </div>
                      <div className="bg-white border border-purple-200 rounded p-3 text-center">
                        <div className="text-2xl mb-1">📦</div>
                        <p className="text-sm font-semibold text-gray-900">Order Fulfillment</p>
                        <p className="text-xs text-gray-600">Ready for pickup</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl p-4 text-center shadow-lg">
                    <div className="text-3xl mb-2">🎉</div>
                    <h3 className="text-lg font-bold mb-1">Complete! User gets automatic confirmation!</h3>
                    <p className="text-sm opacity-90">No searching names, no manual entry - just scan and go!</p>
                  </div>

                  <div className="mt-4">
                    <button className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                      🚀 Try the Demo Flow
                    </button>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4 shadow-sm">
                  <p className="text-sm text-green-800">
                    <strong>Example:</strong> Staff can see which entrance each family used, verify registrations, and distribute appropriate food portions based on family size. This helps with crowd management and logistics.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <section className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">BlessBox - Simplifying registration and verification for organizations</p>
            <p className="text-xs text-gray-400">A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®</p>
          </div>
        </div>
      </section>
    </div>
  );
}