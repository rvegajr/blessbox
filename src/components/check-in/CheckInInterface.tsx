'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RegistrationService } from '@/services/RegistrationService'

interface CheckInInterfaceProps {
  organizationId: string
  staffId?: string
}

interface CheckInResult {
  success: boolean
  registration?: any
  message?: string
  error?: string
}

export function CheckInInterface({ organizationId, staffId }: CheckInInterfaceProps) {
  const [checkInToken, setCheckInToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([])
  const [registrationService] = useState(new RegistrationService())

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkInToken.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const checkInResult = await registrationService.processCheckIn(checkInToken, staffId)
      
      if (checkInResult.success) {
        setResult({
          success: true,
          registration: checkInResult.data,
          message: 'Check-in successful!'
        })
        
        // Add to recent check-ins
        setRecentCheckIns(prev => [
          {
            id: checkInResult.data?.id,
            name: checkInResult.data?.registrationData?.name || 'Unknown',
            email: checkInResult.data?.registrationData?.email || 'Unknown',
            checkedInAt: new Date().toISOString(),
            staffId
          },
          ...prev.slice(0, 9) // Keep only last 10
        ])
        
        // Clear the token input
        setCheckInToken('')
      } else {
        setResult({
          success: false,
          error: checkInResult.error || 'Check-in failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'An error occurred during check-in'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQRScan = () => {
    // In a real implementation, this would open the device camera for QR scanning
    // For now, we'll show a placeholder
    alert('QR Scanner would open here. This feature requires camera access.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check-In System</h1>
          <p className="text-gray-600 mt-2">Scan QR codes or enter tokens to check in attendees</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Check-In Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Check-In</CardTitle>
                <CardDescription>Enter a check-in token manually</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div>
                    <label htmlFor="checkInToken" className="block text-sm font-medium text-gray-700 mb-2">
                      Check-In Token
                    </label>
                    <input
                      type="text"
                      id="checkInToken"
                      value={checkInToken}
                      onChange={(e) => setCheckInToken(e.target.value)}
                      placeholder="Enter check-in token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !checkInToken.trim()}
                  >
                    {isLoading ? 'Processing...' : 'Check In'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* QR Scanner */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>Scan QR codes directly from attendee devices</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleQRScan}
                  className="w-full h-32 flex flex-col items-center justify-center space-y-2"
                  variant="outline"
                >
                  <div className="text-4xl">📱</div>
                  <span>Open QR Scanner</span>
                </Button>
              </CardContent>
            </Card>

            {/* Result Display */}
            {result && (
              <Card className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <div className={`text-2xl ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✅' : '❌'}
                    </div>
                    <div>
                      <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.success ? 'Check-In Successful!' : 'Check-In Failed'}
                      </p>
                      <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message || result.error}
                      </p>
                    </div>
                  </div>
                  
                  {result.success && result.registration && (
                    <div className="mt-4 p-3 bg-white rounded-md border">
                      <h4 className="font-medium text-gray-900 mb-2">Registration Details:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Name:</strong> {result.registration.registrationData?.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {result.registration.registrationData?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {result.registration.registrationData?.phone || 'N/A'}</p>
                        <p><strong>Registered:</strong> {new Date(result.registration.registeredAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Check-Ins */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-Ins</CardTitle>
                <CardDescription>Last 10 check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                {recentCheckIns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📋</div>
                    <p>No recent check-ins</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentCheckIns.map((checkIn, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{checkIn.name}</p>
                          <p className="text-sm text-gray-600">{checkIn.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(checkIn.checkedInAt).toLocaleTimeString()}
                          </p>
                          <div className="flex items-center space-x-1 text-green-600">
                            <span className="text-xs">✅</span>
                            <span className="text-xs">Checked In</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Today's Check-Ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{recentCheckIns.length}</div>
                  <div className="text-sm text-blue-800">Total Check-Ins</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {recentCheckIns.filter(ci => 
                      new Date(ci.checkedInAt).toDateString() === new Date().toDateString()
                    ).length}
                  </div>
                  <div className="text-sm text-green-800">Today</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {staffId ? '1' : '0'}
                  </div>
                  <div className="text-sm text-purple-800">Active Staff</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

