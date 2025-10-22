'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSettings } from '@/interfaces/IFormBuilderService'

interface FormSettingsPanelProps {
  settings: FormSettings
  onUpdate: (settings: FormSettings) => void
}

export function FormSettingsPanel({ settings, onUpdate }: FormSettingsPanelProps) {
  const handleToggle = (key: keyof FormSettings, value: boolean) => {
    onUpdate({
      ...settings,
      [key]: value
    })
  }

  const handleTextChange = (key: keyof FormSettings, value: string) => {
    onUpdate({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Form Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Form Behavior</CardTitle>
          <CardDescription>Configure how the form behaves for users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Allow Multiple Submissions
              </label>
              <p className="text-sm text-gray-500">
                Let users submit the form multiple times
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowMultipleSubmissions}
                onChange={(e) => handleToggle('allowMultipleSubmissions', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Require Email Verification
              </label>
              <p className="text-sm text-gray-500">
                Users must verify their email before form submission
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => handleToggle('requireEmailVerification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Show Progress Bar
              </label>
              <p className="text-sm text-gray-500">
                Display a progress indicator during form completion
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showProgressBar}
                onChange={(e) => handleToggle('showProgressBar', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Form Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Form Appearance</CardTitle>
          <CardDescription>Customize the visual appearance of your form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Theme
            </label>
            <select
              value={settings.customTheme || 'default'}
              onChange={(e) => handleTextChange('customTheme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
              <option value="colorful">Colorful</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redirect URL (Optional)
            </label>
            <input
              type="url"
              value={settings.redirectUrl || ''}
              onChange={(e) => handleTextChange('redirectUrl', e.target.value)}
              placeholder="https://example.com/thank-you"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Where to redirect users after successful form submission
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmation Message
            </label>
            <textarea
              value={settings.confirmationMessage || ''}
              onChange={(e) => handleTextChange('confirmationMessage', e.target.value)}
              placeholder="Thank you for your submission! We'll be in touch soon."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Message to show users after successful form submission
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Form Validation</CardTitle>
          <CardDescription>Configure validation rules and error messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Validation Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Required field validation</li>
              <li>• Email format validation</li>
              <li>• Phone number format validation</li>
              <li>• Custom validation rules</li>
              <li>• Real-time validation feedback</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">Smart Validation</h4>
            <p className="text-sm text-green-800">
              Our smart validation system automatically detects and validates:
            </p>
            <ul className="text-sm text-green-800 space-y-1 mt-2">
              <li>• International phone number formats</li>
              <li>• Country-specific validation rules</li>
              <li>• Real-time format suggestions</li>
              <li>• Accessibility compliance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

