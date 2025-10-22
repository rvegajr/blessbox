/**
 * QR Code Service Tests
 * 
 * Test-Driven Development for QRCodeService
 * Following TDD principles: Red -> Green -> Refactor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QRCodeService } from '@/services/QRCodeService'
import { IQRCodeService, QRCodeSetConfig, QRImageOptions } from '@/interfaces/IQRCodeService'

describe('QRCodeService', () => {
  let qrCodeService: IQRCodeService

  beforeEach(() => {
    qrCodeService = new QRCodeService()
  })

  describe('generateQRCodeSet', () => {
    it('should create a new QR code set successfully', async () => {
      // Arrange
      const orgId = 'org_123'
      const config: QRCodeSetConfig = {
        name: 'Event Registration QR Codes',
        language: 'en',
        formFields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Full Name',
            required: true
          },
          {
            id: 'field_2',
            type: 'email',
            label: 'Email Address',
            required: true
          }
        ],
        qrCodes: [
          {
            id: 'qr_1',
            label: 'Main Entrance',
            entryPoint: 'main',
            isActive: true
          },
          {
            id: 'qr_2',
            label: 'VIP Entrance',
            entryPoint: 'vip',
            isActive: true
          }
        ]
      }

      // Act
      const result = await qrCodeService.generateQRCodeSet(orgId, config)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBeDefined()
      expect(result.data?.organizationId).toBe(orgId)
      expect(result.data?.name).toBe(config.name)
      expect(result.data?.language).toBe(config.language)
      expect(result.data?.formFields).toHaveLength(2)
      expect(result.data?.qrCodes).toHaveLength(2)
      expect(result.data?.isActive).toBe(true)
    })

    it('should handle validation errors for invalid config', async () => {
      // Arrange
      const orgId = 'org_123'
      const invalidConfig: QRCodeSetConfig = {
        name: '',
        language: '',
        formFields: [],
        qrCodes: []
      }

      // Act
      const result = await qrCodeService.generateQRCodeSet(orgId, invalidConfig)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('generateQRCodeImage', () => {
    it('should generate QR code image as Buffer', async () => {
      // Arrange
      const url = 'https://blessbox.org/register/org123/qr456'
      const options: QRImageOptions = {
        size: 256,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      }

      // Act
      const result = await qrCodeService.generateQRCodeImage(url, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Buffer)
      expect(result.data!.length).toBeGreaterThan(0)
    })

    it('should generate QR code with default options', async () => {
      // Arrange
      const url = 'https://blessbox.org/register/org123/qr456'

      // Act
      const result = await qrCodeService.generateQRCodeImage(url)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Buffer)
    })

    it('should handle invalid URL gracefully', async () => {
      // Arrange
      const invalidUrl = ''

      // Act
      const result = await qrCodeService.generateQRCodeImage(invalidUrl)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('generateQRCodeImageBase64', () => {
    it('should generate QR code as base64 data URL', async () => {
      // Arrange
      const url = 'https://blessbox.org/register/org123/qr456'
      const options: QRImageOptions = {
        size: 200,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      }

      // Act
      const result = await qrCodeService.generateQRCodeImageBase64(url, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(typeof result.data).toBe('string')
      expect(result.data!.startsWith('data:image/png;base64,')).toBe(true)
    })

    it('should generate QR code with custom branding', async () => {
      // Arrange
      const url = 'https://blessbox.org/register/org123/qr456'
      const options: QRImageOptions = {
        size: 300,
        margin: 6,
        color: {
          dark: '#2563eb',
          light: '#f8fafc'
        },
        errorCorrectionLevel: 'Q',
        logoUrl: 'https://blessbox.org/logo.png',
        logoSize: 50
      }

      // Act
      const result = await qrCodeService.generateQRCodeImageBase64(url, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.startsWith('data:image/png;base64,')).toBe(true)
    })
  })

  describe('generateRegistrationURL', () => {
    it('should generate correct registration URL', () => {
      // Arrange
      const orgSlug = 'tech-conference-2024'
      const qrCodeId = 'qr_entrance_1'

      // Act
      const url = qrCodeService.generateRegistrationURL(orgSlug, qrCodeId)

      // Assert
      expect(url).toBe('http://localhost:7777/register/tech-conference-2024/qr_entrance_1')
    })

    it('should use environment URL when available', () => {
      // Arrange
      const originalUrl = process.env.NEXTAUTH_URL
      process.env.NEXTAUTH_URL = 'https://app.blessbox.org'
      const orgSlug = 'event-org'
      const qrCodeId = 'qr_123'

      // Act
      const url = qrCodeService.generateRegistrationURL(orgSlug, qrCodeId)

      // Assert
      expect(url).toBe('https://app.blessbox.org/register/event-org/qr_123')

      // Cleanup
      process.env.NEXTAUTH_URL = originalUrl
    })
  })

  describe('generateCheckInURL', () => {
    it('should generate correct check-in URL', () => {
      // Arrange
      const checkInToken = 'checkin_token_abc123'

      // Act
      const url = qrCodeService.generateCheckInURL(checkInToken)

      // Assert
      expect(url).toBe('http://localhost:7777/checkin/checkin_token_abc123')
    })
  })

  describe('trackQRCodeScan', () => {
    it('should track QR code scan successfully', async () => {
      // Arrange
      const scanData = {
        qrCodeId: 'qr_123',
        qrCodeSetId: 'qrset_456',
        organizationId: 'org_789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        deviceType: 'mobile',
        browser: 'Chrome',
        os: 'iOS',
        referrer: 'https://example.com',
        sessionId: 'session_123',
        metadata: { source: 'social_media' }
      }

      // Act
      const result = await qrCodeService.trackQRCodeScan(scanData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('QR code scan tracked successfully')
    })

    it('should handle tracking errors gracefully', async () => {
      // Arrange
      const invalidScanData = {
        qrCodeId: '',
        qrCodeSetId: '',
        organizationId: '',
        ipAddress: '',
        userAgent: '',
        deviceType: '',
        browser: '',
        os: '',
        referrer: '',
        sessionId: '',
        metadata: {}
      }

      // Act
      const result = await qrCodeService.trackQRCodeScan(invalidScanData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getQRCodeAnalytics', () => {
    it('should return QR code analytics for organization', async () => {
      // Arrange
      const orgId = 'org_123'
      const timeRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }

      // Act
      const result = await qrCodeService.getQRCodeAnalytics(orgId, timeRange)

      // Assert
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getQRCodeUsageStats', () => {
    it('should return usage statistics for QR code set', async () => {
      // Arrange
      const qrCodeSetId = 'qrset_123'

      // Act
      const result = await qrCodeService.getQRCodeUsageStats(qrCodeSetId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.qrCodeSetId).toBe(qrCodeSetId)
      expect(typeof result.data?.totalScans).toBe('number')
      expect(typeof result.data?.conversionRate).toBe('number')
    })
  })

  describe('validateQRCodeAccess', () => {
    it('should validate QR code access correctly', async () => {
      // Arrange
      const qrCodeId = 'qr_123'
      const organizationId = 'org_456'

      // Act
      const result = await qrCodeService.validateQRCodeAccess(qrCodeId, organizationId)

      // Assert
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isQRCodeActive', () => {
    it('should check if QR code is active', async () => {
      // Arrange
      const qrCodeId = 'qr_123'

      // Act
      const result = await qrCodeService.isQRCodeActive(qrCodeId)

      // Assert
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getDefaultQRImageOptions', () => {
    it('should return default QR image options', () => {
      // Act
      const options = qrCodeService.getDefaultQRImageOptions()

      // Assert
      expect(options).toBeDefined()
      expect(options.size).toBe(200)
      expect(options.margin).toBe(4)
      expect(options.color.dark).toBe('#000000')
      expect(options.color.light).toBe('#FFFFFF')
      expect(options.errorCorrectionLevel).toBe('M')
    })
  })
})