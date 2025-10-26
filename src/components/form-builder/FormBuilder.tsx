'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormField, FormSettings } from '@/interfaces/IFormBuilderService'
import { FieldEditor } from './FieldEditor'
import { FormPreview } from './FormPreview'
import { FormSettingsPanel } from './FormSettingsPanel'

interface FormBuilderProps {
  initialFields?: FormField[]
  initialSettings?: FormSettings
  onSave: (fields: FormField[], settings: FormSettings) => void
  onCancel: () => void
}

export function FormBuilder({ 
  initialFields = [], 
  initialSettings = {
    allowMultipleSubmissions: false,
    requireEmailVerification: true,
    showProgressBar: true
  },
  onSave,
  onCancel 
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields)
  const [settings, setSettings] = useState<FormSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'settings'>('builder')
  const [draggedField, setDraggedField] = useState<FormField | null>(null)

  const addField = useCallback((type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      placeholder: '',
      required: false,
      order: fields.length + 1,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    }
    setFields(prev => [...prev, newField])
  }, [])

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }, [])

  const removeField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId))
  }, [])

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    setFields(prev => {
      const newFields = [...prev]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return newFields
    })
  }, [])

  const handleDragStart = useCallback((field: FormField) => {
    setDraggedField(field)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedField) {
      const draggedIndex = fields.findIndex(f => f.id === draggedField.id)
      if (draggedIndex !== -1) {
        moveField(draggedIndex, targetIndex)
      }
    }
    setDraggedField(null)
  }, [draggedField, fields, moveField])

  const handleSave = useCallback(() => {
    onSave(fields, settings)
  }, [fields, settings, onSave])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-600 mt-2">Create custom registration forms with drag-and-drop functionality</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'builder', label: 'Form Builder', icon: '🛠️' },
                { id: 'preview', label: 'Preview', icon: '👁️' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Field Types */}
          {activeTab === 'builder' && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Field Types</CardTitle>
                  <CardDescription>Drag fields to the form area</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { type: 'text', label: 'Text Input', icon: '📝' },
                    { type: 'email', label: 'Email', icon: '📧' },
                    { type: 'phone', label: 'Phone', icon: '📞' },
                    { type: 'select', label: 'Dropdown', icon: '📋' },
                    { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
                    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
                    { type: 'textarea', label: 'Text Area', icon: '📄' },
                    { type: 'number', label: 'Number', icon: '🔢' },
                    { type: 'date', label: 'Date', icon: '📅' }
                  ].map((fieldType) => (
                    <div
                      key={fieldType.type}
                      draggable
                      onDragStart={() => addField(fieldType.type as FormField['type'])}
                      className="p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{fieldType.icon}</span>
                        <span className="text-sm font-medium">{fieldType.label}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Area */}
          <div className={`${activeTab === 'builder' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {activeTab === 'builder' && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>Drag and drop to reorder fields</CardDescription>
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>No fields added yet. Drag field types from the sidebar to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => handleDragStart(field)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <FieldEditor
                            field={field}
                            onUpdate={(updates) => updateField(field.id, updates)}
                            onRemove={() => removeField(field.id)}
                            onMoveUp={index > 0 ? () => moveField(index, index - 1) : undefined}
                            onMoveDown={index < fields.length - 1 ? () => moveField(index, index + 1) : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'preview' && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Preview</CardTitle>
                  <CardDescription>See how your form will look to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormPreview fields={fields} settings={settings} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Settings</CardTitle>
                  <CardDescription>Configure form behavior and appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormSettingsPanel
                    settings={settings}
                    onUpdate={setSettings}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={fields.length === 0}>
            Save Form
          </Button>
        </div>
      </div>
    </div>
  )
}

