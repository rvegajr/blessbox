'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface FormSettings {
  allowMultipleSubmissions: boolean
  requireEmailVerification: boolean
  showProgressBar: boolean
  customTheme?: string
}

export default function FormBuilderPage() {
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formSettings, setFormSettings] = useState<FormSettings>({
    allowMultipleSubmissions: false,
    requireEmailVerification: true,
    showProgressBar: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const addFormField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false
    }
    setFormFields(prev => [...prev, newField])
  }

  const updateFormField = (index: number, field: Partial<FormField>) => {
    setFormFields(prev => prev.map((f, i) => 
      i === index ? { ...f, ...field } : f
    ))
  }

  const removeFormField = (index: number) => {
    setFormFields(prev => prev.filter((_, i) => i !== index))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formFields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
      setFormFields(newFields)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/form-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formFields,
          formSettings
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/onboarding/qr-configuration')
      } else {
        setError(data.error || 'Failed to save form configuration')
      }
    } catch (error) {
      setError('An error occurred while saving form configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const renderFieldEditor = (field: FormField, index: number) => {
    return (
      <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => moveField(index, 'up')}
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => moveField(index, 'down')}
              disabled={index === formFields.length - 1}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeFormField(index)}
            >
              Remove
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              value={field.type}
              onChange={(e) => updateFormField(index, { type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="text">Text Input</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="select">Dropdown</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio Buttons</option>
              <option value="textarea">Text Area</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateFormField(index, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Full Name"
            />
          </div>
        </div>

        {field.type === 'select' || field.type === 'radio' ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options (one per line)
            </label>
            <textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => updateFormField(index, { 
                options: e.target.value.split('\n').filter(opt => opt.trim()) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder Text
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateFormField(index, { placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter placeholder text..."
            />
          </div>
        )}

        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={(e) => updateFormField(index, { required: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor={`required-${field.id}`} className="text-sm text-gray-700">
            This field is required
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
              Step 3 of 5: Form Builder
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
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Form Builder</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded">
                  <div className="h-1 bg-blue-600 rounded" style={{ width: '60%' }}></div>
                </div>
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
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Builder */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Build Your Registration Form</CardTitle>
                  <CardDescription>
                    Create the form that people will fill out when they scan your QR codes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    <div className="space-y-4">
                      {formFields.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📝</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Fields Yet</h3>
                          <p className="text-gray-600 mb-4">
                            Add form fields to collect information from your registrants.
                          </p>
                          <Button type="button" onClick={addFormField}>
                            Add Your First Field
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {formFields.map((field, index) => renderFieldEditor(field, index))}
                        </div>
                      )}

                      {formFields.length > 0 && (
                        <div className="text-center">
                          <Button type="button" onClick={addFormField} variant="outline">
                            Add Another Field
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || formFields.length === 0}
                      >
                        {isLoading ? 'Saving Form...' : 'Continue to QR Configuration'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Form Settings & Preview */}
            <div className="space-y-6">
              {/* Form Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Allow Multiple Submissions
                    </label>
                    <input
                      type="checkbox"
                      checked={formSettings.allowMultipleSubmissions}
                      onChange={(e) => setFormSettings(prev => ({
                        ...prev,
                        allowMultipleSubmissions: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Require Email Verification
                    </label>
                    <input
                      type="checkbox"
                      checked={formSettings.requireEmailVerification}
                      onChange={(e) => setFormSettings(prev => ({
                        ...prev,
                        requireEmailVerification: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Show Progress Bar
                    </label>
                    <input
                      type="checkbox"
                      checked={formSettings.showProgressBar}
                      onChange={(e) => setFormSettings(prev => ({
                        ...prev,
                        showProgressBar: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Preview</CardTitle>
                  <CardDescription>How your form will look to users</CardDescription>
                </CardHeader>
                <CardContent>
                  {formFields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Add fields to see preview
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formFields.map((field, index) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label || `Field ${index + 1}`}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              disabled
                            />
                          ) : field.type === 'textarea' ? (
                            <textarea
                              placeholder={field.placeholder}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              disabled
                            />
                          ) : field.type === 'select' ? (
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              disabled
                            >
                              <option>Select an option</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.type === 'checkbox' ? (
                            <div className="flex items-center">
                              <input type="checkbox" disabled className="mr-2" />
                              <span className="text-sm text-gray-600">{field.label}</span>
                            </div>
                          ) : field.type === 'radio' ? (
                            <div className="space-y-2">
                              {field.options?.map((option) => (
                                <label key={option} className="flex items-center">
                                  <input type="radio" name={field.id} disabled className="mr-2" />
                                  <span className="text-sm text-gray-600">{option}</span>
                                </label>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

