import { NextRequest, NextResponse } from 'next/server';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';
import { getEnv } from '@/lib/utils/env';
import { hasGatewayAuth } from '@/lib/services/gatewayConfig';

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
    hasGateway: hasGatewayAuth(),
    sendGridFromEmail: getEnv('SENDGRID_FROM_EMAIL', 'not set'),
    relayUrl: getEnv('SENDGRID_API_URL') || 'https://api.sendgrid.noctusoft.com (default)',
  };

  // All email goes through the Noctusoft gateway relay (NOCTUSOFT_DEPLOY_KEY).
  let activeService = 'none';
  let status = 'error';
  let message = '';

  if (config.hasGateway) {
    activeService = 'Noctusoft gateway (SendGrid relay)';
    status = config.sendGridFromEmail !== 'not set' ? 'ready' : 'warning';
    message = config.sendGridFromEmail !== 'not set'
      ? 'Email gateway is configured and ready'
      : 'NOCTUSOFT_DEPLOY_KEY set but SENDGRID_FROM_EMAIL not set';
  } else if (isDev) {
    activeService = 'development (logging only)';
    status = 'warning';
    message = 'No email gateway configured - emails will only be logged to console';
  } else {
    status = 'error';
    message = 'No email gateway configured! Emails will not be sent.';
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

  if (!config.hasGateway) {
    recommendations.push('Set NOCTUSOFT_DEPLOY_KEY — the Noctusoft gateway handles SendGrid for the app (the app holds no SendGrid key).');
  }

  if (config.hasGateway && config.sendGridFromEmail === 'not set') {
    recommendations.push('Set SENDGRID_FROM_EMAIL (the from-address; not a secret). It must be a verified sender on the gateway.');
  }

  return recommendations;
}

