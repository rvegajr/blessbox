/**
 * GET /api/system/payment-diagnostics
 * 
 * Comprehensive payment system diagnostics
 * Shows configuration, validates credentials, tests connectivity
 * Protected by DIAGNOSTICS_SECRET in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { SquarePaymentService } from '@/lib/services/SquarePaymentService';

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const diagnosticsSecret = process.env.DIAGNOSTICS_SECRET;
  
  return !!diagnosticsSecret && token === diagnosticsSecret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: {},
    validation: {},
    connectivity: {},
    recommendations: []
  };

  try {
    // 1. Check Environment Variables (with sanitization)
    const { getEnv } = await import('@/lib/utils/env');
    const accessToken = getEnv('SQUARE_ACCESS_TOKEN');
    const applicationId = getEnv('SQUARE_APPLICATION_ID');
    const locationId = getEnv('SQUARE_LOCATION_ID');
    const environment = getEnv('SQUARE_ENVIRONMENT');

    diagnostics.configuration = {
      SQUARE_ACCESS_TOKEN: {
        present: !!accessToken,
        length: accessToken.length,
        prefix: accessToken.substring(0, 10) || 'none',
        masked: accessToken ? `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 4)}` : 'NOT SET'
      },
      SQUARE_APPLICATION_ID: {
        present: !!applicationId,
        value: applicationId || 'NOT SET',
        format: applicationId.startsWith('sq0') ? 'valid' : 'invalid'
      },
      SQUARE_LOCATION_ID: {
        present: !!locationId,
        value: locationId || 'NOT SET',
        length: locationId.length
      },
      SQUARE_ENVIRONMENT: {
        value: environment || 'NOT SET',
        expected: 'production or sandbox'
      }
    };

    // 2. Validate Token Formats
    diagnostics.validation = {
      accessToken: {
        format: accessToken.startsWith('EAA') || accessToken.startsWith('EAAA') ? 'valid' : 'invalid',
        explanation: 'Should start with EAA (sandbox) or EAAA (production)'
      },
      applicationId: {
        format: applicationId.startsWith('sq0idp-') ? 'valid' : 'invalid',
        explanation: 'Should start with sq0idp-'
      },
      locationId: {
        format: locationId.length > 0 ? 'present' : 'missing',
        explanation: 'Location ID from Square Dashboard'
      }
    };

    // 3. Test Square SDK Initialization
    try {
      const squareService = new SquarePaymentService();
      diagnostics.connectivity.sdkInitialization = {
        success: true,
        message: 'SquarePaymentService initialized successfully'
      };

      // 4. Test Square API Connectivity
      try {
        const { SquareClient, SquareEnvironment } = require('square');
        
        const client = new SquareClient({
          accessToken,
          environment: environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
        });

        // Test API connectivity by attempting to list payments
        try {
          const testResponse = await client.payments.list({
            locationId,
            limit: 1
          });
          
          diagnostics.connectivity.squareAPI = {
            success: true,
            endpoint: environment === 'production' 
              ? 'https://connect.squareup.com' 
              : 'https://connect.squareupsandbox.com',
            message: 'Successfully authenticated with Square API',
            testCall: 'payments.list',
            locationId: locationId,
            configuredLocationValid: true // If we can call API with this location, it's valid
          };

        } catch (apiError: any) {
          const statusCode = apiError.statusCode || apiError.status || 0;
          
          diagnostics.connectivity.squareAPI = {
            success: false,
            error: apiError.message || String(apiError),
            statusCode,
            errorCode: apiError.code,
            details: apiError.errors || []
          };

          if (statusCode === 401) {
            diagnostics.recommendations.push({
              severity: 'CRITICAL',
              message: 'Square API authentication failed (401 Unauthorized)',
              action: 'SQUARE_ACCESS_TOKEN is invalid or expired. Generate new token in Square Dashboard → Developer → Applications'
            });
          } else if (statusCode === 403) {
            diagnostics.recommendations.push({
              severity: 'CRITICAL',
              message: 'Square API permission denied (403 Forbidden)',
              action: 'Access token lacks required permissions. Generate new token with PAYMENTS_WRITE permission'
            });
          } else if (apiError.message?.includes('location')) {
            diagnostics.recommendations.push({
              severity: 'ERROR',
              message: 'Location ID may be invalid',
              action: 'Verify SQUARE_LOCATION_ID matches a location in your Square account'
            });
          } else {
            diagnostics.recommendations.push({
              severity: 'ERROR',
              message: `Square API error: ${apiError.message || 'Unknown'}`,
              action: 'Check Square Dashboard for account status and API logs'
            });
          }
        }

      } catch (apiTestError: any) {
        // Catch errors from the API test try block
        diagnostics.connectivity.squareAPI = {
          success: false,
          error: apiTestError.message || String(apiTestError)
        };
      }

    } catch (sdkError: any) {
      diagnostics.connectivity.sdkInitialization = {
        success: false,
        error: sdkError.message || String(sdkError)
      };
      
      diagnostics.recommendations.push({
        severity: 'CRITICAL',
        message: 'Failed to initialize Square SDK',
        action: 'Check if Square SDK is installed: npm list square'
      });
    }

    // 5. Configuration Completeness Check
    const missingConfig = [];
    if (!accessToken) missingConfig.push('SQUARE_ACCESS_TOKEN');
    if (!applicationId) missingConfig.push('SQUARE_APPLICATION_ID');
    if (!locationId) missingConfig.push('SQUARE_LOCATION_ID');

    if (missingConfig.length > 0) {
      diagnostics.recommendations.push({
        severity: 'CRITICAL',
        message: `Missing required configuration: ${missingConfig.join(', ')}`,
        action: 'Set missing environment variables in Vercel dashboard'
      });
    }

    // 6. Environment Mismatch Check
    if (environment === 'sandbox' && accessToken.startsWith('EAAA')) {
      diagnostics.recommendations.push({
        severity: 'WARNING',
        message: 'Environment mismatch: sandbox mode with production token',
        action: 'Set SQUARE_ENVIRONMENT=production or use sandbox token'
      });
    }

    if (environment === 'production' && accessToken.startsWith('EAA') && !accessToken.startsWith('EAAA')) {
      diagnostics.recommendations.push({
        severity: 'WARNING',
        message: 'Environment mismatch: production mode with sandbox token',
        action: 'Set SQUARE_ENVIRONMENT=sandbox or use production token'
      });
    }

    // 7. Overall Status
    const allConfigPresent = accessToken && applicationId && locationId;
    const validFormats = 
      (accessToken.startsWith('EAA') || accessToken.startsWith('EAAA')) &&
      applicationId.startsWith('sq0idp-') &&
      locationId.length > 0;
    const apiConnects = diagnostics.connectivity.squareAPI?.success === true;

    diagnostics.overall = {
      status: allConfigPresent && validFormats && apiConnects ? 'READY' : 'NOT READY',
      configurationComplete: allConfigPresent,
      formatsValid: validFormats,
      apiConnectivity: apiConnects,
      canAcceptPayments: allConfigPresent && validFormats && apiConnects
    };

  } catch (error) {
    diagnostics.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

