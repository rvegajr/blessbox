// INotificationService - Interface Segregation Principle Compliant
// Single responsibility: Sending automated email notifications for various events

export interface NotificationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RegistrationConfirmationData {
  recipientEmail: string;
  recipientName?: string;
  organizationName: string;
  registrationId: string;
  registrationData: Record<string, any>;
  qrCodeLabel?: string;
}

export interface AdminNotificationData {
  organizationId: string;
  adminEmail: string;
  eventType: 'new_registration' | 'check_in' | 'payment_received' | 'subscription_expired';
  eventData: Record<string, any>;
  organizationName: string;
}

export interface CheckInReminderData {
  recipientEmail: string;
  recipientName?: string;
  organizationName: string;
  eventDate?: string;
  eventTime?: string;
  checkInInstructions?: string;
}

export interface INotificationService {
  // Registration notifications
  sendRegistrationConfirmation(data: RegistrationConfirmationData): Promise<NotificationResult>;
  
  // Admin notifications
  notifyAdmin(data: AdminNotificationData): Promise<NotificationResult>;
  
  // Check-in notifications
  sendCheckInReminder(data: CheckInReminderData): Promise<NotificationResult>;
  
  // Utility methods
  ensureTemplatesExist(organizationId: string): Promise<void>;
}
