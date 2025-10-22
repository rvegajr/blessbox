'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QRCodeConfig {
  id: string
  label: string
  entryPoint: string
  isActive: boolean
}

interface QRCodeSetConfig {
  name: string
  language: string
  qrCodes: QRCodeConfig[]
}

export default function QRConfigurationPage() {
  const [config, setConfig] = useState<QRCodeSetConfig>({
    name: '',
    language: 'en',
    qrCodes: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const addQRCode = () => {
    const newQRCode: QRCodeConfig = {
      id: `qr_${Date.now()}`,
      label: '',
      entryPoint: 'registration',
      isActive: true
    }
    setConfig(prev => ({
      ...prev,
      qrCodes: [...prev.qrCodes, newQRCode]
    }))
  }

  const updateQRCode = (index: number, qrCode: Partial<QRCodeConfig>) => {
    setConfig(prev => ({
      ...prev,
      qrCodes: prev.qrCodes.map((q, i) => 
        i === index ? { ...q, ...qrCode } : q
      )
    }))
  }

  const removeQRCode = (index: number) => {
    setConfig(prev => ({
      ...prev,
      qrCodes: prev.qrCodes.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/qr-configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/onboarding/complete')
      } else {
        setError(data.error || 'Failed to configure QR codes')
      }
    } catch (error) {
      setError('An error occurred while configuring QR codes')
    } finally {
      setIsLoading(false)
    }
  }

  const renderQRCodeEditor = (qrCode: QRCodeConfig, index: number) => {
    return (
      <div key={qrCode.id} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">QR Code {index + 1}</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeQRCode(index)}
          >
            Remove
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QR Code Label
            </label>
            <input
              type="text"
              value={qrCode.label}
              onChange={(e) => updateQRCode(index, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., General Registration, VIP Entry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Point
            </label>
            <select
              value={qrCode.entryPoint}
              onChange={(e) => updateQRCode(index, { entryPoint: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="registration">Registration</option>
              <option value="checkin">Check-in</option>
              <option value="survey">Survey</option>
              <option value="feedback">Feedback</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id={`active-${qrCode.id}`}
            checked={qrCode.isActive}
            onChange={(e) => updateQRCode(index, { isActive: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor={`active-${qrCode.id}`} className="text-sm text-gray-700">
            This QR code is active
          </label>
        </div>
      </div>
    )
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
              Step 4 of 5: QR Configuration
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
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Organization Setup</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Email Verification</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Form Builder</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-green-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">QR Configuration</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded">
                  <div className="h-1 bg-blue-600 rounded" style={{ width: '80%' }}></div>
                </div>
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
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* QR Configuration */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configure Your QR Codes</CardTitle>
                  <CardDescription>
                    Set up the QR codes that people will scan to access your registration form.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    {/* QR Code Set Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">QR Code Set Configuration</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            QR Code Set Name
                          </label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={config.name}
                            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Event Registration QR Codes"
                          />
                        </div>

                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                            Language
                          </label>
                          <select
                            id="language"
                            name="language"
                            value={config.language}
                            onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* QR Codes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">QR Codes</h3>
                        <Button type="button" onClick={addQRCode} variant="outline">
                          Add QR Code
                        </Button>
                      </div>

                      {config.qrCodes.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📱</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Yet</h3>
                          <p className="text-gray-600 mb-4">
                            Add QR codes to your set. Each QR code can have different entry points.
                          </p>
                          <Button type="button" onClick={addQRCode}>
                            Add Your First QR Code
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {config.qrCodes.map((qrCode, index) => renderQRCodeEditor(qrCode, index))}
                        </div>
                      )}

                      {config.qrCodes.length > 0 && (
                        <div className="text-center">
                          <Button type="button" onClick={addQRCode} variant="outline">
                            Add Another QR Code
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || config.qrCodes.length === 0}
                      >
                        {isLoading ? 'Configuring QR Codes...' : 'Complete Setup & Access Dashboard'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Preview & Help */}
            <div className="space-y-6">
              {/* QR Code Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Preview</CardTitle>
                  <CardDescription>How your QR codes will look</CardDescription>
                </CardHeader>
                <CardContent>
                  {config.qrCodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Add QR codes to see preview
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {config.qrCodes.map((qrCode, index) => (
                        <div key={qrCode.id} className="border rounded-lg p-4 text-center">
                          <div className="w-24 h-24 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                            <span className="text-2xl">📱</span>
                          </div>
                          <h4 className="font-medium text-gray-900">{qrCode.label || `QR Code ${index + 1}`}</h4>
                          <p className="text-sm text-gray-600">{qrCode.entryPoint}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                            qrCode.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {qrCode.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help & Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>Use descriptive labels to identify different QR codes</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>You can create multiple QR codes for different entry points</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>QR codes can be printed, displayed on screens, or shared digitally</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>Test your QR codes before distributing them</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

