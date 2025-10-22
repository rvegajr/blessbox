'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface QRCodeConfig {
  id: string
  label: string
  entryPoint: string
  isActive: boolean
}

export default function CreateQRCodeSetPage() {
  const [formData, setFormData] = useState({
    name: '',
    language: 'en',
    formFields: [] as FormField[],
    qrCodes: [] as QRCodeConfig[]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const router = useRouter()

  const addFormField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false
    }
    setFormData(prev => ({
      ...prev,
      formFields: [...prev.formFields, newField]
    }))
  }

  const updateFormField = (index: number, field: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map((f, i) => 
        i === index ? { ...f, ...field } : f
      )
    }))
  }

  const removeFormField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.filter((_, i) => i !== index)
    }))
  }

  const addQRCode = () => {
    const newQRCode: QRCodeConfig = {
      id: `qr_${Date.now()}`,
      label: '',
      entryPoint: 'registration',
      isActive: true
    }
    setFormData(prev => ({
      ...prev,
      qrCodes: [...prev.qrCodes, newQRCode]
    }))
  }

  const updateQRCode = (index: number, qrCode: Partial<QRCodeConfig>) => {
    setFormData(prev => ({
      ...prev,
      qrCodes: prev.qrCodes.map((q, i) => 
        i === index ? { ...q, ...qrCode } : q
      )
    }))
  }

  const removeQRCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qrCodes: prev.qrCodes.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'current', // This would be the actual org ID
          name: formData.name,
          language: formData.language,
          formFields: formData.formFields,
          qrCodes: formData.qrCodes
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard/qr-codes')
      } else {
        setError(data.error || 'Failed to create QR code set')
      }
    } catch (error) {
      setError('An error occurred while creating the QR code set')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && formData.name.trim()) {
      setStep(2)
    } else if (step === 2 && formData.formFields.length > 0) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard">← Back to Dashboard</Link>
              </Button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Create QR Code Set</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Create QR Code Set</CardTitle>
              <CardDescription>
                Step {step} of 3: {
                  step === 1 ? 'Basic Information' : 
                  step === 2 ? 'Form Fields' : 
                  'QR Code Configuration'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Step 1: Basic Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        QR Code Set Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Event Registration, Volunteer Sign-up"
                      />
                    </div>

                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                        Language
                      </label>
                      <select
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <Button type="button" onClick={nextStep} className="w-full">
                      Next: Configure Form Fields
                    </Button>
                  </div>
                )}

                {/* Step 2: Form Fields */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Form Fields</h3>
                      <Button type="button" onClick={addFormField} variant="outline">
                        Add Field
                      </Button>
                    </div>

                    {formData.formFields.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Fields Yet</h3>
                        <p className="text-gray-600 mb-4">
                          Add form fields to collect information from registrants.
                        </p>
                        <Button type="button" onClick={addFormField}>
                          Add Your First Field
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.formFields.map((field, index) => (
                          <div key={field.id} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Field Type
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateFormField(index, { type: e.target.value as any })}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="text">Text</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                  <option value="select">Select</option>
                                  <option value="checkbox">Checkbox</option>
                                  <option value="radio">Radio</option>
                                  <option value="textarea">Textarea</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Label
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateFormField(index, { label: e.target.value })}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Field label"
                                />
                              </div>

                              <div className="flex items-end space-x-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateFormField(index, { required: e.target.checked })}
                                    className="mr-2"
                                  />
                                  Required
                                </label>
                                <Button
                                  type="button"
                                  onClick={() => removeFormField(index)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                        Previous
                      </Button>
                      <Button type="button" onClick={nextStep} className="flex-1">
                        Next: Configure QR Codes
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: QR Code Configuration */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">QR Code Configuration</h3>
                      <Button type="button" onClick={addQRCode} variant="outline">
                        Add QR Code
                      </Button>
                    </div>

                    {formData.qrCodes.length === 0 ? (
                      <div className="text-center py-8">
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
                        {formData.qrCodes.map((qrCode, index) => (
                          <div key={qrCode.id} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  QR Code Label
                                </label>
                                <input
                                  type="text"
                                  value={qrCode.label}
                                  onChange={(e) => updateQRCode(index, { label: e.target.value })}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., General Registration, VIP Entry"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Entry Point
                                </label>
                                <input
                                  type="text"
                                  value={qrCode.entryPoint}
                                  onChange={(e) => updateQRCode(index, { entryPoint: e.target.value })}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="registration, checkin, etc."
                                />
                              </div>

                              <div className="flex items-end space-x-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={qrCode.isActive}
                                    onChange={(e) => updateQRCode(index, { isActive: e.target.checked })}
                                    className="mr-2"
                                  />
                                  Active
                                </label>
                                <Button
                                  type="button"
                                  onClick={() => removeQRCode(index)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                        Previous
                      </Button>
                      <Button type="submit" disabled={isLoading} className="flex-1">
                        {isLoading ? 'Creating...' : 'Create QR Code Set'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

