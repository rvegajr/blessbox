'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface QRCodeSet {
  id: string
  name: string
  language: string
  formFields: FormField[]
  qrCodes: Array<{
    id: string
    label: string
    entryPoint: string
    isActive: boolean
  }>
}

export default function RegistrationPage() {
  const params = useParams()
  const [qrCodeSet, setQrCodeSet] = useState<QRCodeSet | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchQRCodeSet = async () => {
      try {
        // This would typically fetch based on orgSlug and qrCodeId
        // For now, we'll use a mock response
        const mockQRCodeSet: QRCodeSet = {
          id: 'qrset_123',
          name: 'Event Registration',
          language: 'en',
          formFields: [
            {
              id: 'name',
              type: 'text',
              label: 'Full Name',
              required: true
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: false
            },
            {
              id: 'dietary',
              type: 'select',
              label: 'Dietary Restrictions',
              required: false,
              options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Other']
            }
          ],
          qrCodes: [
            {
              id: params.qrCodeId as string,
              label: 'General Registration',
              entryPoint: 'registration',
              isActive: true
            }
          ]
        }
        
        setQrCodeSet(mockQRCodeSet)
      } catch (error) {
        setError('Failed to load registration form')
      } finally {
        setLoading(false)
      }
    }

    if (params.orgSlug && params.qrCodeId) {
      fetchQRCodeSet()
    }
  }, [params.orgSlug, params.qrCodeId])

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeSetId: qrCodeSet?.id,
          qrCodeId: params.qrCodeId,
          registrationData: formData
        }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred during registration')
    } finally {
      setSubmitting(false)
    }
  }

  const renderFormField = (field: FormField) => {
    const value = formData[field.id] || ''

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            id={field.id}
            name={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'select':
        return (
          <select
            id={field.id}
            name={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="mt-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                id={field.id}
                name={field.id}
                checked={value}
                onChange={(e) => handleInputChange(field.id, e.target.checked)}
                className="mr-2"
              />
              {field.label}
            </label>
          </div>
        )

      case 'radio':
        return (
          <div className="mt-1 space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration form...</p>
        </div>
      </div>
    )
  }

  if (error && !qrCodeSet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Successful!</h3>
            <p className="text-gray-600">
              Thank you for registering. You will receive a confirmation email shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{qrCodeSet?.name}</CardTitle>
            <CardDescription>
              Please fill out the form below to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {qrCodeSet?.formFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFormField(field)}
                </div>
              ))}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Complete Registration'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

