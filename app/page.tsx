export default function HomePage() {
  return (
    <main className="grow">
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
        {/* Header */}
        <section className="py-12">
          <div className="max-w-6xl bg-white 2xl:max-w-[1400px] mx-auto border-x border-gray-200 p-4">
            <div className="text-center">
              <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-6xl md:text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 bg-clip-text text-transparent" style={{WebkitTextStroke: '2px #1e40af', textStroke: '2px #1e40af'}}>
                BlessBox
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Streamlined QR-based registration and verification system for organizations
              </p>
            </div>
          </div>
        </section>

        {/* Main 4-Panel Grid */}
        <section className="pb-12">
          <div className="max-w-6xl bg-white 2xl:max-w-[1400px] mx-auto border-x border-gray-200 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
              
              {/* Panel 1: Organization Login/Registration */}
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" id="panel1-demo-step">
                <div className="flex items-center mb-6">
                  <div className="bg-teal-100 p-3 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-layout-users-group w-6 h-6 md:w-8 md:h-8 text-teal-600">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                      <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1"></path>
                      <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                      <path d="M17 10h2a2 2 0 0 1 2 2v1"></path>
                      <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                      <path d="M3 13v-1a2 2 0 0 1 2 -2h2"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800">
                    1. Organization Setup
                  </h2>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md">
                      <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-2 text-center">
                        Register Your Organization
                      </h3>
                      <p className="text-sm text-gray-600 mb-6 text-center">
                        Create an account for your organization to manage registrations
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Food Bank Central" 
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Weekly Food Distribution" 
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Custom Domain</label>
                          <div className="flex">
                            <div className="h-12 bg-gray-100 border border-gray-300 rounded-l-lg px-4 flex items-center text-gray-500">
                              blessbox.org/
                            </div>
                            <input 
                              type="text" 
                              placeholder="yourname" 
                              className="flex-1 h-12 px-4 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="text-right text-xs text-gray-500 mt-1">0/255</div>
                        </div>
                      </div>
                      
                      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Sign Up
                      </button>
                      
                      <p className="text-sm text-gray-600 mt-4 text-center">
                        Already have an account? <a href="#" className="text-blue-600 hover:underline">Login</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">
                      <strong>Example:</strong> "Food Bank Central" registers to manage food donation distributions
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel 2: QR Code Configuration */}
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" id="panel2-demo-step">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-qrcode w-6 h-6 md:w-8 md:h-8 text-blue-600">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path>
                      <path d="M17 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path>
                      <path d="M4 17m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path>
                      <path d="M17 17h.01"></path>
                      <path d="M20 17h.01"></path>
                      <path d="M17 20h.01"></path>
                      <path d="M20 20h.01"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800">
                    2. Create QR Codes
                  </h2>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-4">
                      QR Code Configuration
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Label (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Main Entrance, Station A, Weekly Distribution" 
                          className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Help staff identify different QR codes for the same event</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                        <select className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option>Food Donation</option>
                          <option>Seminar Registration</option>
                          <option>Volunteer Sign-up</option>
                          <option>Custom Event</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Required Information</label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" checked className="rounded border-gray-300 text-blue-600" readOnly />
                            <span className="text-sm text-gray-700">Name</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" checked className="rounded border-gray-300 text-blue-600" readOnly />
                            <span className="text-sm text-gray-700">Phone Number</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600" readOnly />
                            <span className="text-sm text-gray-700">Family Size</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Create Multiple QR Codes</label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" checked className="text-blue-600" readOnly />
                            <span className="text-sm text-gray-700">Single QR Code</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" className="text-blue-600" readOnly />
                            <span className="text-sm text-gray-700">Multiple QR Codes (for different locations/stations)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-6">
                      Generate QR Code(s)
                    </button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">
                      <strong>Example:</strong> Create multiple QR codes for "Weekly Food Distribution" - one labeled "Main Entrance" and another "Side Door" - both requiring name, phone, and family size
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel 3: Display & Scan */}
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" id="panel3-demo-step">
                <div className="flex items-center mb-6">
                  <div className="bg-yellow-100 p-3 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-scan w-6 h-6 md:w-8 md:h-8 text-yellow-600">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M4 7v-1a2 2 0 0 1 2 -2h2"></path>
                      <path d="M4 17v1a2 2 0 0 0 2 2h2"></path>
                      <path d="M16 4h2a2 2 0 0 1 2 2v1"></path>
                      <path d="M16 20h2a2 2 0 0 0 2 -2v-1"></path>
                      <path d="M5 12l1 0"></path>
                      <path d="M13 12l1 0"></path>
                      <path d="M9 12l1 0"></path>
                      <path d="M17 12l1 0"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800">
                    3. Display & Scan
                  </h2>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 mb-2">
                          <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-400 rounded"></div>
                          </div>
                          <p className="text-sm font-medium">Main Entrance</p>
                          <p className="text-xs text-gray-500">Food Distribution QR</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 mb-2">
                          <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-400 rounded"></div>
                          </div>
                          <p className="text-sm font-medium">Side Door</p>
                          <p className="text-xs text-gray-500">Food Distribution QR</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-center text-sm text-gray-500 mb-6">
                      Scan with your phone camera • Both QR codes lead to the same registration form
                    </p>
                    
                    {/* Mobile Registration Form Mockup */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Registration Form</h4>
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          className="w-full h-8 px-3 border border-gray-300 rounded text-sm"
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone Number" 
                          className="w-full h-8 px-3 border border-gray-300 rounded text-sm"
                        />
                        <select className="w-full h-8 px-3 border border-gray-300 rounded text-sm">
                          <option>Family Size</option>
                          <option>1-2 people</option>
                          <option>3-4 people</option>
                          <option>5+ people</option>
                        </select>
                        <button className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium">
                          Submit Registration
                        </button>
                      </div>
                    </div>
                    
                    {/* User Submits Registration Form */}
                    <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                        <h4 className="text-lg md:text-xl font-semibold text-blue-800">User Submits Registration Form</h4>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Name:</span>
                            <div className="text-gray-600">Maria Rodriguez</div>
                          </div>
                          <div>
                            <span className="font-medium">Family Size:</span>
                            <div className="text-gray-600">4 members</div>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Phone:</span>
                            <div className="text-gray-600">(555) 123-4567</div>
                          </div>
                        </div>
                        <button className="w-full bg-green-600 text-white py-2 rounded text-sm font-medium mt-4">
                          🎉 Submit Registration
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">
                      <strong>Example:</strong> Families can scan either QR code (Main Entrance or Side Door), fill out the same form on their phone, and submit registration instantly. Staff can track which entrance was used.
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel 4: The QR Magic */}
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10" id="panel4-demo-step">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 p-3 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-magic-wand w-6 h-6 md:w-8 md:h-8 text-purple-600">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M3 21l18 -18"></path>
                      <path d="M5.5 5.5l13 13"></path>
                      <path d="M9 9l4 4"></path>
                      <path d="M15 15l4 4"></path>
                      <path d="M5 5l4 4"></path>
                      <path d="M15 15l4 4"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800">
                    4. The QR Magic! ✨
                  </h2>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 rounded-lg font-bold text-lg mb-8">
                      ✨ INSTANT MAGIC! ✨
                    </button>
                    
                    <div className="space-y-8">
                      {/* Section 1 */}
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-semibold text-green-800 mb-4">QR Code Appears Instantly!</h3>
                          <div className="bg-gray-100 rounded-lg p-4 text-center mb-4">
                            <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <div className="w-12 h-12 bg-gray-400 rounded"></div>
                            </div>
                            <p className="text-sm text-gray-600">📱 User shows this QR code to staff</p>
                            <p className="text-sm font-medium text-gray-900 mt-2">"Unique check-in token: abc123-def456"</p>
                            <p className="text-xs text-yellow-700 mt-1">⚠️ Keep this page open until checked in!</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section 2 */}
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-semibold text-purple-800 mb-4">Organization Worker Scans QR Code</h3>
                          <div className="bg-gray-100 rounded-lg p-4 text-center">
                            <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <div className="w-12 h-12 bg-gray-400 rounded"></div>
                            </div>
                            <p className="text-sm text-gray-600">📱 Staff scans with their phone</p>
                            <p className="text-sm text-gray-600">Instant verification & check-in interface loads</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section 3 */}
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-semibold text-orange-800 mb-4">Ready for Distribution, Action, Attendance!</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <span className="text-xl">🍎</span>
                              </div>
                              <p className="text-sm font-medium">Food Distribution</p>
                              <p className="text-xs text-gray-500">Ready to distribute items</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <span className="text-xl">📋</span>
                              </div>
                              <p className="text-sm font-medium">Event Check-In</p>
                              <p className="text-xs text-gray-500">Attendance confirmed</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <span className="text-xl">📦</span>
                              </div>
                              <p className="text-sm font-medium">Order Fulfillment</p>
                              <p className="text-xs text-gray-500">Ready for pickup</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section 4 */}
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">🎉</div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold mb-2">Complete! User gets automatic confirmation!</h3>
                          <p className="text-sm text-gray-600">No searching names, no manual entry - just scan and go!</p>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium mt-8">
                      🚀 Try the Demo Flow
                    </button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">
                      <strong>Example:</strong> Staff can see which entrance each family used, verify registrations, and distribute appropriate food portions based on family size. This helps with crowd management and logistics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">BlessBox - Simplifying registration and verification for organizations</p>
          <p className="text-sm text-gray-500">A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®</p>
        </div>
      </footer>
    </main>
  )
}