'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/interfaces/IFormBuilderService'

interface FieldEditorProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function FieldEditor({ 
  field, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLabelChange = (label: string) => {
    onUpdate({ label })
  }

  const handlePlaceholderChange = (placeholder: string) => {
    onUpdate({ placeholder })
  }

  const handleRequiredChange = (required: boolean) => {
    onUpdate({ required })
  }

  const handleOptionsChange = (options: string[]) => {
    onUpdate({ options })
  }

  const addOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
    handleOptionsChange(newOptions)
  }

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || []
    handleOptionsChange(newOptions)
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])]
    newOptions[index] = value
    handleOptionsChange(newOptions)
  }

  const getFieldIcon = (type: FormField['type']) => {
    const icons = {
      text: '📝',
      email: '📧',
      phone: '📞',
      select: '📋',
      radio: '🔘',
      checkbox: '☑️',
      textarea: '📄',
      number: '🔢',
      date: '📅'
    }
    return icons[type] || '📝'
  }

  const getFieldLabel = (type: FormField['type']) => {
    const labels = {
      text: 'Text Input',
      email: 'Email',
      phone: 'Phone',
      select: 'Dropdown',
      radio: 'Radio Buttons',
      checkbox: 'Checkbox',
      textarea: 'Text Area',
      number: 'Number',
      date: 'Date'
    }
    return labels[type] || 'Text Input'
  }

  return (
    <div className="space-y-4">
      {/* Field Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFieldIcon(field.type)}</span>
          <div>
            <h3 className="font-medium text-gray-900">
              {field.label || `${getFieldLabel(field.type)} Field`}
            </h3>
            <p className="text-sm text-gray-500">{getFieldLabel(field.type)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onMoveUp && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMoveUp}
              className="p-2"
            >
              ↑
            </Button>
          )}
          {onMoveDown && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMoveDown}
              className="p-2"
            >
              ↓
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2"
          >
            {isExpanded ? '−' : '+'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="p-2 text-red-600 hover:text-red-700"
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Field Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label || `${getFieldLabel(field.type)} Field`}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderFieldPreview(field)}
      </div>

      {/* Field Configuration */}
      {isExpanded && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Basic Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Label
                </label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Enter field label"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => handlePlaceholderChange(e.target.value)}
                  placeholder="Enter placeholder text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required-${field.id}`}
                  checked={field.required}
                  onChange={(e) => handleRequiredChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`required-${field.id}`} className="ml-2 text-sm text-gray-700">
                  Required field
                </label>
              </div>

              {/* Options for select, radio, checkbox */}
              {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {field.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="w-full"
                    >
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function renderFieldPreview(field: FormField) {
  const commonProps = {
    placeholder: field.placeholder,
    required: field.required,
    className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  }

  switch (field.type) {
    case 'text':
      return <input type="text" {...commonProps} />
    
    case 'email':
      return <input type="email" {...commonProps} />
    
    case 'phone':
      return <input type="tel" {...commonProps} />
    
    case 'number':
      return <input type="number" {...commonProps} />
    
    case 'date':
      return <input type="date" {...commonProps} />
    
    case 'textarea':
      return <textarea {...commonProps} rows={3} />
    
    case 'select':
      return (
        <select {...commonProps}>
          <option value="">Select an option</option>
          {field.options?.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <label key={index} className="flex items-center">
              <input
                type="radio"
                name={`preview-${field.id}`}
                value={option}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )
    
    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <label key={index} className="flex items-center">
              <input
                type="checkbox"
                value={option}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )
    
    default:
      return <input type="text" {...commonProps} />
  }
}

