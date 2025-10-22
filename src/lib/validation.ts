import { z } from 'zod'

// Email validation
export const emailSchema = z.string().email('Please enter a valid email address')

// Phone validation with international support
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be no more than 15 digits')
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')

// Organization name validation
export const organizationNameSchema = z.string()
  .min(2, 'Organization name must be at least 2 characters')
  .max(100, 'Organization name must be no more than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, 'Organization name contains invalid characters')

// Event name validation
export const eventNameSchema = z.string()
  .min(2, 'Event name must be at least 2 characters')
  .max(100, 'Event name must be no more than 100 characters')
  .optional()

// Address validation
export const addressSchema = z.string()
  .min(5, 'Address must be at least 5 characters')
  .max(200, 'Address must be no more than 200 characters')
  .optional()

// City validation
export const citySchema = z.string()
  .min(2, 'City must be at least 2 characters')
  .max(50, 'City must be no more than 50 characters')
  .optional()

// State validation
export const stateSchema = z.string()
  .min(2, 'State must be at least 2 characters')
  .max(50, 'State must be no more than 50 characters')
  .optional()

// ZIP code validation
export const zipSchema = z.string()
  .min(5, 'ZIP code must be at least 5 characters')
  .max(10, 'ZIP code must be no more than 10 characters')
  .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code')
  .optional()

// Form field validation
export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'radio', 'textarea']),
  label: z.string().min(1, 'Field label is required'),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional()
})

// QR code validation
export const qrCodeSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'QR code label is required'),
  entryPoint: z.string().min(1, 'Entry point is required'),
  isActive: z.boolean()
})

// Organization setup validation
export const organizationSetupSchema = z.object({
  name: organizationNameSchema,
  eventName: eventNameSchema,
  contactEmail: emailSchema,
  contactPhone: phoneSchema.optional(),
  contactAddress: addressSchema,
  contactCity: citySchema,
  contactState: stateSchema,
  contactZip: zipSchema,
  eventDescription: z.string().max(500, 'Event description must be no more than 500 characters').optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().max(100, 'Event location must be no more than 100 characters').optional()
})

// Form builder validation
export const formBuilderSchema = z.object({
  formFields: z.array(formFieldSchema).min(1, 'At least one form field is required'),
  formSettings: z.object({
    allowMultipleSubmissions: z.boolean(),
    requireEmailVerification: z.boolean(),
    showProgressBar: z.boolean(),
    customTheme: z.string().optional()
  })
})

// QR configuration validation
export const qrConfigurationSchema = z.object({
  name: z.string().min(1, 'QR code set name is required'),
  language: z.string().min(2, 'Language is required'),
  qrCodes: z.array(qrCodeSchema).min(1, 'At least one QR code is required')
})

// Registration validation
export const registrationSchema = z.object({
  qrCodeSetId: z.string().min(1, 'QR Code Set ID is required'),
  qrCodeId: z.string().min(1, 'QR Code ID is required'),
  registrationData: z.record(z.any())
})

// Real-time validation functions
export const validateField = (field: any, value: any): { isValid: boolean; error?: string } => {
  try {
    switch (field.type) {
      case 'email':
        emailSchema.parse(value)
        break
      case 'phone':
        phoneSchema.parse(value)
        break
      case 'text':
      case 'textarea':
        if (field.required && (!value || value.trim().length === 0)) {
          return { isValid: false, error: `${field.label} is required` }
        }
        if (value && value.length > (field.maxLength || 1000)) {
          return { isValid: false, error: `${field.label} is too long` }
        }
        break
      case 'select':
      case 'radio':
        if (field.required && !value) {
          return { isValid: false, error: `${field.label} is required` }
        }
        if (value && field.options && !field.options.includes(value)) {
          return { isValid: false, error: `Please select a valid option for ${field.label}` }
        }
        break
      case 'checkbox':
        if (field.required && !value) {
          return { isValid: false, error: `${field.label} is required` }
        }
        break
    }
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message }
    }
    return { isValid: false, error: 'Invalid input' }
  }
}

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

// Email validation with domain check
export const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1]
    // In a real implementation, you would check if the domain exists
    // For now, we'll just check if it looks like a valid domain
    return domain && domain.includes('.') && domain.length > 3
  } catch {
    return false
  }
}

// Organization slug generation
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// QR code URL validation
export const validateQRCodeURL = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

