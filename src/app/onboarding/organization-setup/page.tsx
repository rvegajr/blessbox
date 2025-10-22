'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OrganizationSetupData {
  name: string
  eventName: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  contactCity: string
  contactState: string
  contactZip: string
  eventDescription: string
  eventDate: string
  eventLocation: string
}

export default function OrganizationSetupPage() {
  const [formData, setFormData] = useState<OrganizationSetupData>({
    name: '',
    eventName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    contactCity: '',
    contactState: '',
    contactZip: '',
    eventDescription: '',
    eventDate: '',
    eventLocation: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/organization-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Move to email verification step
        router.push('/onboarding/email-verification')
      } else {
        setError(data.error || 'Failed to create organization')
      }
    } catch (error) {
      setError('An error occurred during organization setup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof OrganizationSetupData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">BlessBox Setup</h1>
            </div>
            <div className="text-sm text-gray-600">
              Step 1 of 5: Organization Setup
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Organization Setup</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded">
                  <div className="h-1 bg-blue-600 rounded" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">2</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">Email Verification</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">3</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">Form Builder</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">4</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">QR Configuration</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">5</span>
                </div>
                <span className="ml-2 text-sm text-gray-600">Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Organization Setup</CardTitle>
              <CardDescription>
                Let's start by setting up your organization details. This information will be used to create your BlessBox account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Organization Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Organization Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Community Health Center"
                      />
                    </div>

                    <div>
                      <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                        Event/Program Name
                      </label>
                      <input
                        id="eventName"
                        name="eventName"
                        type="text"
                        value={formData.eventName}
                        onChange={(e) => handleInputChange('eventName', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Annual Health Fair"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                      Contact Email *
                    </label>
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contact@yourorganization.org"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                      Contact Phone
                    </label>
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
                  
                  <div>
                    <label htmlFor="contactAddress" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      id="contactAddress"
                      name="contactAddress"
                      type="text"
                      value={formData.contactAddress}
                      onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="contactCity" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        id="contactCity"
                        name="contactCity"
                        type="text"
                        value={formData.contactCity}
                        onChange={(e) => handleInputChange('contactCity', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label htmlFor="contactState" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        id="contactState"
                        name="contactState"
                        type="text"
                        value={formData.contactState}
                        onChange={(e) => handleInputChange('contactState', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <label htmlFor="contactZip" className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        id="contactZip"
                        name="contactZip"
                        type="text"
                        value={formData.contactZip}
                        onChange={(e) => handleInputChange('contactZip', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Event Information</h3>
                  
                  <div>
                    <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">
                      Event Description
                    </label>
                    <textarea
                      id="eventDescription"
                      name="eventDescription"
                      rows={3}
                      value={formData.eventDescription}
                      onChange={(e) => handleInputChange('eventDescription', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your event or program..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                        Event Date
                      </label>
                      <input
                        id="eventDate"
                        name="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => handleInputChange('eventDate', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700">
                        Event Location
                      </label>
                      <input
                        id="eventLocation"
                        name="eventLocation"
                        type="text"
                        value={formData.eventLocation}
                        onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Venue name or address"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Organization...' : 'Continue to Email Verification'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

