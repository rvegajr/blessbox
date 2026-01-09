/**
 * IEmailTransport - Email transport layer interface (ISP)
 * 
 * Single responsibility: Send emails via external service
 * No business logic, just transport
 */

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  type: string; // MIME type (e.g., 'image/png')
  disposition?: 'attachment' | 'inline';
  contentId?: string; // For inline images (cid:xxx)
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempts?: number;
}

export interface IEmailTransport {
  /**
   * Send single email directly
   * No retries, single attempt
   */
  sendDirect(message: EmailMessage): Promise<EmailResult>;

  /**
   * Send email with automatic retry logic
   * Retries on transient failures with exponential backoff
   */
  sendWithRetry(
    message: EmailMessage,
    maxAttempts?: number
  ): Promise<EmailResult>;
}

