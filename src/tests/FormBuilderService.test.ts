/**
 * Form Builder Service Tests
 * 
 * Test-Driven Development for FormBuilderService
 * Following TDD principles: Red -> Green -> Refactor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FormBuilderService } from '@/services/FormBuilderService'
import { IFormBuilderService, FormCreateData, FormField, FormSettings } from '@/interfaces/IFormBuilderService'

describe('FormBuilderService', () => {
  let formBuilderService: IFormBuilderService

  beforeEach(() => {
    formBuilderService = new FormBuilderService()
  })

  describe('createForm', () => {
    it('should create a new form successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Event Registration Form',
        description: 'Registration form for annual conference',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true,
            order: 1
          },
          {
            id: 'field_2',
            type: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true,
            order: 2
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: true,
          showProgressBar: true,
          submitButtonText: 'Register Now',
          successMessage: 'Registration successful!'
        }
      }

      // Act
      const result = await formBuilderService.createForm(orgId, formData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBeDefined()
      expect(result.data?.organizationId).toBe(orgId)
      expect(result.data?.name).toBe(formData.name)
      expect(result.data?.fields).toHaveLength(2)
      expect(result.data?.isActive).toBe(true)
    })

    it('should handle validation errors for invalid form data', async () => {
      // Arrange
      const orgId = 'org_123'
      const invalidFormData: FormCreateData = {
        name: '',
        description: '',
        fields: [],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }

      // Act
      const result = await formBuilderService.createForm(orgId, invalidFormData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateForm', () => {
    it('should update form successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.updateForm(created.data!.id, {
        name: 'Updated Form Name',
        description: 'Updated description'
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Updated Form Name')
      expect(result.data?.description).toBe('Updated description')
    })

    it('should return error for non-existent form', async () => {
      // Act
      const result = await formBuilderService.updateForm('non-existent-id', {
        name: 'Updated Name'
      })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getForm', () => {
    it('should retrieve form by ID', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.getForm(created.data!.id)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(created.data!.id)
      expect(result.data?.name).toBe(formData.name)
    })

    it('should return error for non-existent form', async () => {
      // Act
      const result = await formBuilderService.getForm('non-existent-id')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('addField', () => {
    it('should add field to form successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)
      const newField: FormField = {
        id: 'field_2',
        type: 'email',
        label: 'Email',
        required: true,
        order: 2
      }

      // Act
      const result = await formBuilderService.addField(created.data!.id, newField)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.fields).toHaveLength(2)
      expect(result.data?.fields[1].id).toBe('field_2')
    })
  })

  describe('removeField', () => {
    it('should remove field from form successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          },
          {
            id: 'field_2',
            type: 'email',
            label: 'Email',
            required: true,
            order: 2
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.removeField(created.data!.id, 'field_2')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.fields).toHaveLength(1)
      expect(result.data?.fields[0].id).toBe('field_1')
    })
  })

  describe('validateFormSubmission', () => {
    it('should validate form submission successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          },
          {
            id: 'field_2',
            type: 'email',
            label: 'Email',
            required: true,
            order: 2
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.validateFormSubmission(created.data!.id, {
        formId: created.data!.id,
        fieldValues: {
          field_1: 'John Doe',
          field_2: 'john@example.com'
        }
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.isValid).toBe(true)
      expect(result.data?.errors).toHaveLength(0)
    })

    it('should return validation errors for invalid submission', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          },
          {
            id: 'field_2',
            type: 'email',
            label: 'Email',
            required: true,
            order: 2
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.validateFormSubmission(created.data!.id, {
        formId: created.data!.id,
        fieldValues: {
          field_1: '', // Empty required field
          field_2: 'invalid-email' // Invalid email format
        }
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.isValid).toBe(false)
      expect(result.data?.errors.length).toBeGreaterThan(0)
    })
  })

  describe('getFormTemplates', () => {
    it('should return available form templates', async () => {
      // Act
      const result = await formBuilderService.getFormTemplates()

      // Assert
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data?.length).toBeGreaterThan(0)
    })
  })

  describe('createFormFromTemplate', () => {
    it('should create form from template successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const templateId = 'event-registration'
      const customizations = {
        name: 'Custom Event Registration',
        description: 'Customized from template'
      }

      // Act
      const result = await formBuilderService.createFormFromTemplate(templateId, orgId, customizations)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Custom Event Registration')
      expect(result.data?.fields.length).toBeGreaterThan(0)
    })
  })

  describe('getFormAnalytics', () => {
    it('should return form analytics', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.getFormAnalytics(created.data!.id)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.totalSubmissions).toBeDefined()
      expect(result.data?.completionRate).toBeDefined()
    })
  })

  describe('exportFormData', () => {
    it('should export form data as CSV', async () => {
      // Arrange
      const orgId = 'org_123'
      const formData: FormCreateData = {
        name: 'Test Form',
        description: 'Test description',
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Name',
            required: true,
            order: 1
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: false
        }
      }
      const created = await formBuilderService.createForm(orgId, formData)

      // Act
      const result = await formBuilderService.exportFormData(created.data!.id, 'csv')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Buffer)
    })
  })
})

