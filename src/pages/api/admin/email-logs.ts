import type { APIRoute } from 'astro';

// In-memory email log storage (in production, use a database or external service)
interface EmailLog {
  timestamp: string;
  provider: 'SendGrid' | 'Gmail';
  to: string;
  from: string;
  subject: string;
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

// Store last 100 email attempts
const emailLogs: EmailLog[] = [];
const MAX_LOGS = 100;

export function logEmailAttempt(log: EmailLog) {
  emailLogs.unshift(log); // Add to beginning
  if (emailLogs.length > MAX_LOGS) {
    emailLogs.splice(MAX_LOGS); // Keep only last 100
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const filter = url.searchParams.get('filter'); // 'success', 'failed', or null for all
    
    let filteredLogs = emailLogs;
    
    // Apply filter
    if (filter === 'success') {
      filteredLogs = emailLogs.filter(log => log.success);
    } else if (filter === 'failed') {
      filteredLogs = emailLogs.filter(log => !log.success);
    }
    
    // Limit results
    const logs = filteredLogs.slice(0, limit);
    
    // Calculate stats
    const stats = {
      total: emailLogs.length,
      successful: emailLogs.filter(log => log.success).length,
      failed: emailLogs.filter(log => !log.success).length,
      sendgridCount: emailLogs.filter(log => log.provider === 'SendGrid').length,
      gmailCount: emailLogs.filter(log => log.provider === 'Gmail').length,
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        logs,
        pagination: {
          showing: logs.length,
          total: filteredLogs.length,
          hasMore: filteredLogs.length > limit
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};