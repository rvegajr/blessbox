import { NextRequest, NextResponse } from 'next/server';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';
import { getEnv } from '@/lib/utils/env';

/**
 * Debug endpoint to check email configuration.
 * Diagnostics-secret gated in ALL environments (returns 404 in prod when secret absent).
 */
export async function GET(request: NextRequest) {
  const authFailure = requireDiagnosticsSecret(request);
  if (authFailure) return authFailure;

  const isDev = process.env.NODE_ENV !== 'production';

  const config = {
    nodeEnv: process.env.NODE_ENV,
    emailProvider: getEnv('EMAIL_PROVIDER', 'not set'),
    hasSendGrid: !!getEnv('SENDGRID_API_KEY'),
    sendGridFromEmail: getEnv('SENDGRID_FROM_EMAIL', 'not set'),
    hasSmtp: !!(getEnv('SMTP_HOST') && getEnv('SMTP_USER') && getEnv('SMTP_PASS')),
    smtpHost: getEnv('SMTP_HOST', 'not set'),
    smtpUser: getEnv('SMTP_USER') ? '***set***' : 'not set',
    smtpPort: getEnv('SMTP_PORT', 'not set'),
  };

  // Determine which email service will be used
  let activeService = 'none';
  let status = 'error';
  let message = '';

  if (config.hasSendGrid) {
    activeService = 'SendGrid';
    status = config.sendGridFromEmail !== 'not set' ? 'ready' : 'warning';
    message = config.sendGridFromEmail !== 'not set' 
      ? 'SendGrid is configured and ready'
      : 'SendGrid API key found but FROM_EMAIL not set';
  } else if (config.hasSmtp) {
    activeService = 'SMTP';
    status = 'ready';
    message = 'SMTP is configured and ready';
  } else if (isDev) {
    activeService = 'development (logging only)';
    status = 'warning';
    message = 'No email service configured - emails will only be logged to console';
  } else {
    status = 'error';
    message = 'No email service configured! Emails will not be sent.';
  }

  return NextResponse.json({
    status,
    activeService,
    message,
    config,
    recommendations: getRecommendations(config),
    note: 'Prefer /api/system/email-health for production-safe diagnostics (supports auth + org templates).',
  });
}

function getRecommendations(config: any): string[] {
  const recommendations: string[] = [];

  if (!config.hasSendGrid && !config.hasSmtp) {
    recommendations.push('Set up either SendGrid or SMTP email service');
    recommendations.push('For SendGrid: Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in Vercel environment variables');
    recommendations.push('For SMTP: Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_PORT in Vercel environment variables');
  }

  if (config.hasSendGrid && config.sendGridFromEmail === 'not set') {
    recommendations.push('Set SENDGRID_FROM_EMAIL in Vercel environment variables');
    recommendations.push('The FROM email must be verified in your SendGrid account');
  }

  if (config.hasSmtp && config.smtpPort === 'not set') {
    recommendations.push('Set SMTP_PORT (usually 587 for TLS or 465 for SSL)');
  }

  return recommendations;
}

