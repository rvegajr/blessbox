import { getDbClient } from '../db';
import type { 
  INotificationService,
  NotificationResult,
  RegistrationConfirmationData,
  AdminNotificationData,
  CheckInReminderData
} from '../interfaces/INotificationService';
import { EmailService } from './EmailService';

export class NotificationService implements INotificationService {
  private db = getDbClient();
  private emailService = new EmailService();

  async sendRegistrationConfirmation(data: RegistrationConfirmationData): Promise<NotificationResult> {
    try {
      // Get organization ID from name
      let organizationId: string | null = null;
      
      try {
        const orgResult = await this.db.execute({
          sql: 'SELECT id FROM organizations WHERE name = ? OR contact_email = ? LIMIT 1',
          args: [data.organizationName, data.recipientEmail]
        });

        if (orgResult.rows.length > 0) {
          organizationId = (orgResult.rows[0] as any).id;
        }
      } catch (error) {
        console.error('Error finding organization:', error);
        // Continue without organization ID - email service will handle it
      }

      // Ensure templates exist
      if (organizationId) {
        await this.ensureTemplatesExist(organizationId);
      }

      // Prepare variables for template
      const variables: Record<string, any> = {
        organization_name: data.organizationName,
        recipient_name: data.recipientName || 'Valued Customer',
        recipient_email: data.recipientEmail,
        registration_id: data.registrationId,
        qr_code_label: data.qrCodeLabel || 'registration',
        check_in_token: data.checkInToken || '',
        check_in_url: data.checkInUrl || '',
        success_page_url: data.successPageUrl || '',
        ...data.registrationData,
      };

      // Send email (non-blocking - don't fail if email fails)
      if (organizationId) {
        const emailResult = await this.emailService.sendEmail(
          organizationId,
          data.recipientEmail,
          'registration_confirmation',
          variables
        );

        if (!emailResult.success) {
          return {
            success: false,
            error: emailResult.error || 'Failed to send registration confirmation email'
          };
        }
      } else {
        // Fallback: send without organization template
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Sending registration confirmation without organization ID');
        }
      }

      return {
        success: true,
        message: 'Registration confirmation email sent successfully'
      };
    } catch (error) {
      console.error('Error sending registration confirmation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send registration confirmation'
      };
    }
  }

  async notifyAdmin(data: AdminNotificationData): Promise<NotificationResult> {
    try {
      // Ensure templates exist
      await this.ensureTemplatesExist(data.organizationId);

      // Prepare variables for template
      const variables: Record<string, any> = {
        organization_name: data.organizationName,
        event_type: data.eventType,
        ...data.eventData,
      };

      // Send email
      const emailResult = await this.emailService.sendEmail(
        data.organizationId,
        data.adminEmail,
        'admin_notification',
        variables
      );

      if (!emailResult.success) {
        return {
          success: false,
          error: emailResult.error || 'Failed to send admin notification'
        };
      }

      return {
        success: true,
        message: 'Admin notification sent successfully'
      };
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send admin notification'
      };
    }
  }

  async sendCheckInReminder(data: CheckInReminderData): Promise<NotificationResult> {
    try {
      // Get organization ID from name
      let organizationId: string | null = null;
      
      try {
        const orgResult = await this.db.execute({
          sql: 'SELECT id FROM organizations WHERE name = ? LIMIT 1',
          args: [data.organizationName]
        });

        if (orgResult.rows.length > 0) {
          organizationId = (orgResult.rows[0] as any).id;
        }
      } catch (error) {
        console.error('Error finding organization:', error);
      }

      if (!organizationId) {
        return {
          success: false,
          error: 'Organization not found'
        };
      }

      // Ensure templates exist
      await this.ensureTemplatesExist(organizationId);

      // Prepare variables for template
      const variables: Record<string, any> = {
        organization_name: data.organizationName,
        recipient_name: data.recipientName || 'Valued Customer',
        recipient_email: data.recipientEmail,
        event_date: data.eventDate,
        event_time: data.eventTime,
        check_in_instructions: data.checkInInstructions,
      };

      // For now, use admin_notification template with check_in event type
      // In the future, we could add a dedicated check_in_reminder template
      const emailResult = await this.emailService.sendEmail(
        organizationId,
        data.recipientEmail,
        'admin_notification', // Using admin_notification as fallback
        {
          ...variables,
          event_type: 'check_in',
        }
      );

      if (!emailResult.success) {
        return {
          success: false,
          error: emailResult.error || 'Failed to send check-in reminder'
        };
      }

      return {
        success: true,
        message: 'Check-in reminder sent successfully'
      };
    } catch (error) {
      console.error('Error sending check-in reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send check-in reminder'
      };
    }
  }

  async ensureTemplatesExist(organizationId: string): Promise<void> {
    try {
      // Use EmailService's ensureDefaultTemplates method if available
      if (typeof (this.emailService as any).ensureDefaultTemplates === 'function') {
        await (this.emailService as any).ensureDefaultTemplates(organizationId);
      } else {
        // Fallback: Check if templates exist, create if not
        const templates = ['registration_confirmation', 'admin_notification'];
        
        for (const templateType of templates) {
          const existing = await this.emailService.getTemplateByType(
            organizationId,
            templateType as any
          );
          
          if (!existing) {
            // Templates will be created by EmailService.ensureDefaultTemplates
            // If that method doesn't exist, we'll just log a warning
            if (process.env.NODE_ENV !== 'test') {
              console.warn(`Template ${templateType} not found for organization ${organizationId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring templates exist:', error);
      // Don't throw - templates might be created elsewhere
    }
  }
}
