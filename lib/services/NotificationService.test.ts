// NotificationService Tests - TDD Approach
// Tests the actual implementation against the interface

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './NotificationService';
import type { 
  RegistrationConfirmationData,
  AdminNotificationData,
  CheckInReminderData
} from '../interfaces/INotificationService';
import { EmailService } from './EmailService';
import { getDbClient } from '../db';

// Mock the database
vi.mock('../db', () => ({
  getDbClient: vi.fn(),
}));

// Mock the email service
vi.mock('./EmailService', () => ({
  EmailService: vi.fn(() => ({
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
    ensureDefaultTemplates: vi.fn().mockResolvedValue(undefined),
    getTemplateByType: vi.fn().mockResolvedValue({
      id: 'template-123',
      organization_id: 'org-123',
      template_type: 'registration_confirmation',
      subject: 'Registration Confirmed',
      html_content: '<h2>Registration Confirmed!</h2>',
      is_active: true,
    }),
  })),
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let mockEmailService: any;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      execute: vi.fn(),
    };
    
    (getDbClient as any).mockReturnValue(mockDb);
    
    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
      ensureDefaultTemplates: vi.fn().mockResolvedValue(undefined),
      getTemplateByType: vi.fn().mockResolvedValue({
        id: 'template-123',
        organization_id: 'org-123',
        template_type: 'registration_confirmation',
        subject: 'Registration Confirmed - {{organization_name}}',
        html_content: '<h2>Registration Confirmed!</h2><p>Thank you for registering with {{organization_name}}.</p>',
        is_active: true,
      }),
    };
    (EmailService as any).mockImplementation(() => mockEmailService);
    
    service = new NotificationService();
  });

  describe('sendRegistrationConfirmation', () => {
    it('should send registration confirmation email successfully', async () => {
      // Mock organization lookup
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'org-123',
          name: 'Test Organization',
        }]
      });

      const data: RegistrationConfirmationData = {
        recipientEmail: 'user@example.com',
        recipientName: 'John Doe',
        organizationName: 'Test Organization',
        registrationId: 'reg-123',
        registrationData: {
          name: 'John Doe',
          email: 'user@example.com',
        },
        qrCodeLabel: 'main-entrance',
      };

      const result = await service.sendRegistrationConfirmation(data);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'org-123',
        'user@example.com',
        'registration_confirmation',
        expect.objectContaining({
          organization_name: 'Test Organization',
          recipient_name: 'John Doe',
        })
      );
    });

    it('should handle missing organization gracefully', async () => {
      // Mock organization lookup - not found
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const data: RegistrationConfirmationData = {
        recipientEmail: 'user@example.com',
        organizationName: 'Test Organization',
        registrationId: 'reg-123',
        registrationData: {},
      };

      const result = await service.sendRegistrationConfirmation(data);

      // Should still attempt to send (non-blocking)
      expect(result.success).toBeDefined();
    });

    it('should handle email service errors gracefully', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'Email service unavailable',
      });

      // Mock organization lookup
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'org-123',
          name: 'Test Organization',
        }]
      });

      const data: RegistrationConfirmationData = {
        recipientEmail: 'user@example.com',
        organizationName: 'Test Organization',
        registrationId: 'reg-123',
        registrationData: {},
      };

      const result = await service.sendRegistrationConfirmation(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('notifyAdmin', () => {
    it('should send admin notification for new registration', async () => {
      // Mock organization lookup
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'org-123',
          name: 'Test Organization',
          contact_email: 'admin@example.com',
        }]
      });

      const data: AdminNotificationData = {
        organizationId: 'org-123',
        adminEmail: 'admin@example.com',
        eventType: 'new_registration',
        eventData: {
          registrationId: 'reg-123',
          registrantName: 'John Doe',
          registrantEmail: 'user@example.com',
        },
        organizationName: 'Test Organization',
      };

      const result = await service.notifyAdmin(data);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'org-123',
        'admin@example.com',
        'admin_notification',
        expect.objectContaining({
          organization_name: 'Test Organization',
          event_type: 'new_registration',
        })
      );
    });

    it('should handle different event types', async () => {
      const eventTypes: AdminNotificationData['eventType'][] = [
        'new_registration',
        'check_in',
        'payment_received',
        'subscription_expired',
      ];

      for (const eventType of eventTypes) {
        vi.clearAllMocks();
        
        // Mock organization lookup
        mockDb.execute.mockResolvedValueOnce({
          rows: [{
            id: 'org-123',
            name: 'Test Organization',
            contact_email: 'admin@example.com',
          }]
        });

        const data: AdminNotificationData = {
          organizationId: 'org-123',
          adminEmail: 'admin@example.com',
          eventType,
          eventData: {},
          organizationName: 'Test Organization',
        };

        await service.notifyAdmin(data);

        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          'org-123',
          'admin@example.com',
          'admin_notification',
          expect.objectContaining({
            event_type: eventType,
          })
        );
      }
    });
  });

  describe('sendCheckInReminder', () => {
    it('should send check-in reminder email', async () => {
      // Mock organization lookup
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'org-123',
          name: 'Test Organization',
        }]
      });

      const data: CheckInReminderData = {
        recipientEmail: 'user@example.com',
        recipientName: 'John Doe',
        organizationName: 'Test Organization',
        eventDate: '2025-01-15',
        eventTime: '10:00 AM',
        checkInInstructions: 'Please arrive 15 minutes early',
      };

      const result = await service.sendCheckInReminder(data);

      expect(result.success).toBe(true);
      // Note: Check-in reminder might use a different template or be implemented differently
      // This test verifies the method exists and can be called
    });
  });

  describe('ensureTemplatesExist', () => {
    it('should ensure default templates exist for organization', async () => {
      // Mock organization lookup
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'org-123',
          name: 'Test Organization',
        }]
      });

      await service.ensureTemplatesExist('org-123');

      expect(mockEmailService.ensureDefaultTemplates).toHaveBeenCalledWith('org-123');
    });

    it('should handle missing organization gracefully', async () => {
      // Mock organization lookup - not found
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.ensureTemplatesExist('non-existent')
      ).resolves.not.toThrow();
    });
  });
});
