'use client';

import { useEffect } from 'react';

export default function HomePage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <section className="py-12" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-black text-6xl md:text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 bg-clip-text text-transparent" style={{WebkitTextStroke: '2px #1e40af', textStroke: '2px #1e40af'}}>
              BlessBox
            </h1>
            <p className="text-base-600 max-w-2xl mx-auto text-lg">
              Streamlined QR-based registration and verification system for organizations
            </p>
          </div>
        </div>
      </section>

      {/* Main 4-Panel Grid */}
      <section className="pb-12" data-aos="fade-up" data-aos-delay="200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Panel 1: Organization Login/Registration */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" data-aos="zoom-in" data-aos-delay="100">
              <div className="flex items-center mb-6">
                <div className="bg-teal-100 p-3 rounded-xl mr-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-base-800">
                  1. Organization Setup
                </h2>
              </div>
              
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <div className="w-16 h-16 text-base-400 mx-auto mb-4">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-base-700 mb-2 text-center">
                      Register Your Organization
                    </h3>
                    <p className="text-base-500 mb-6 text-center">
                      Create an account for your organization to manage registrations
                    </p>
                    
                    <div className="space-y-4">
                      {/* Organization Name */}
                      <div>
                        <label className="block text-sm text-base-600 mb-2">
                          Organization Name
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g., Food Bank Central" 
                          className="w-full p-3 border border-base-300 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>

                      {/* Event Name */}
                      <div>
                        <label className="block text-sm text-base-600 mb-2">
                          Event Name
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g., Weekly Food Distribution" 
                          className="w-full p-3 border border-base-300 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                      
                      <button className="w-full bg-teal-600 text-white py-3 px-6 rounded-xl hover:bg-teal-700 transition-colors">
                        Sign Up
                      </button>
                      
                      <div className="text-center">
                        <p className="text-sm text-base-500">
                          Already have an account?
                          <a href="#" className="text-teal-600 hover:text-teal-700 font-medium ml-1">Login</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-teal-50 rounded-xl p-4 mt-6">
                <p className="text-sm text-teal-700">
                  <strong>Example:</strong> "Food Bank Central" registers to manage food donation distributions
                </p>
              </div>
            </div>

            {/* Panel 2: QR Code Creation */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" data-aos="zoom-in" data-aos-delay="200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-base-800">
                  2. Create QR Codes
                </h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="border-2 border-dashed border-base-200 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-base-700 mb-4">
                    QR Code Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-base-600 mb-1">
                        QR Code Label <span className="text-blue-500">(Optional)</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g., Main Entrance, Station A, Weekly Distribution"
                        className="w-full p-3 border border-base-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-base-600 mb-1">
                        Event Type
                      </label>
                      <select className="w-full p-3 border border-base-200 rounded-lg">
                        <option>Food Donation</option>
                        <option>Seminar Registration</option>
                        <option>Volunteer Sign-up</option>
                        <option>Custom Event</option>
                      </select>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                      Generate QR Code(s)
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  <strong>Example:</strong> Create multiple QR codes for "Weekly Food Distribution" - one labeled "Main Entrance" and another "Side Door"
                </p>
              </div>
            </div>

            {/* Panel 3: QR Display & Scanning */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" data-aos="zoom-in" data-aos-delay="300">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-100 p-3 rounded-xl mr-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-base-800">
                  3. Display & Scan
                </h2>
              </div>
              
              <div className="text-center mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-base-50 border-2 border-dashed border-base-200 rounded-xl p-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-black rounded-lg relative">
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
                    <p className="text-base font-medium text-base-700 mt-3">
                      Main Entrance
                    </p>
                    <p className="text-xs text-base-500">
                      Food Distribution QR
                    </p>
                  </div>

                  <div className="bg-base-50 border-2 border-dashed border-base-200 rounded-xl p-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-black rounded-lg relative">
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
                    <p className="text-base font-medium text-base-700 mt-3">
                      Side Door
                    </p>
                    <p className="text-xs text-base-500">
                      Food Distribution QR
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-base-500 mb-4">
                  Scan with your phone camera • Both QR codes lead to the same registration form
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-sm text-yellow-700">
                  <strong>Example:</strong> Families can scan either QR code (Main Entrance or Side Door), fill out the same form on their phone, and submit registration instantly.
                </p>
              </div>
            </div>

            {/* Panel 4: QR Magic Demonstration */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" data-aos="zoom-in" data-aos-delay="400">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-3 rounded-xl mr-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-base-800">
                  4. The QR Magic! ✨
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg transform rotate-3 animate-bounce">
                    <span className="text-sm font-bold">
                      ✨ INSTANT MAGIC! ✨
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">
                      QR Code Appears Instantly!
                    </h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                    <div className="bg-gray-100 border-4 border-gray-300 rounded-2xl p-4 inline-block mb-4">
                      <div className="w-32 h-32 bg-black relative">
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
                    
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-green-700">
                        📱 User shows this QR code to staff
                      </p>
                      <p className="text-xs text-green-600">
                        Unique check-in token: abc123-def456
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-lg font-bold mb-2">
                    Complete! User gets automatic confirmation!
                  </h3>
                  <p className="text-sm opacity-90">
                    No searching names, no manual entry - just scan and go!
                  </p>
                </div>

                <div className="mt-6">
                  <button className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl transition-colors">
                    🚀 Try the Demo Flow
                  </button>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 mt-6">
                <p className="text-sm text-green-700">
                  <strong>Example:</strong> Staff can see which entrance each family used, verify registrations, and distribute appropriate food portions based on family size.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-8 border-t border-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-base-500">
              BlessBox - Simplifying registration and verification for organizations
            </p>
            <p className="text-xs text-base-400">
              A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
