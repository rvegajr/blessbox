import type { APIRoute } from 'astro';
import { getDatabase } from '../../../database/connection';
import { EmailService } from '../../../services/EmailService';
import { SquarePaymentService } from '../../../implementations/payment/SquarePaymentService';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
  required: boolean;
}

interface EnvironmentVariable {
  name: string;
  status: 'configured' | 'missing' | 'invalid';
  required: boolean;
  value?: string;
  recommendation?: string;
}

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const results: HealthCheckResult[] = [];
  const environmentVars: EnvironmentVariable[] = [];
  
  // Helper function to check environment variable
  const checkEnvVar = (
    name: string, 
    required: boolean = true,
    validator?: (value: string) => boolean,
    recommendation?: string
  ): EnvironmentVariable => {
    const value = process.env[name] || import.meta.env[name];
    let status: 'configured' | 'missing' | 'invalid' = 'missing';
    
    if (value) {
      if (validator) {
        status = validator(value) ? 'configured' : 'invalid';
      } else {
        status = 'configured';
      }
    }
    
    return {
      name,
      status,
      required,
      value: value ? (name.includes('TOKEN') || name.includes('KEY') || name.includes('PASSWORD') 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` 
        : value) : undefined,
      recommendation: status !== 'configured' ? recommendation : undefined
    };
  };
  
  // 1. Check Database Configuration
  console.log('🔍 Checking Database Configuration...');
  const dbUrlVar = checkEnvVar(
    'TURSO_DATABASE_URL',
    true,
    (val) => val.startsWith('libsql://'),
    'Should start with libsql:// (e.g., libsql://your-db.turso.io)'
  );
  const dbTokenVar = checkEnvVar(
    'TURSO_AUTH_TOKEN',
    true,
    (val) => val.length > 20,
    'Generate from: turso db tokens create your-db-name'
  );
  environmentVars.push(dbUrlVar, dbTokenVar);
  
  // Test database connection
  try {
    const db = getDatabase();
    if (db) {
      // Try a simple query
      const result = await db.all('SELECT 1 as test');
      results.push({
        service: 'Database (Turso)',
        status: 'healthy',
        message: 'Connection successful',
        details: { connected: true, responseTime: `${Date.now() - startTime}ms` },
        required: true
      });
    } else {
      throw new Error('Database not initialized');
    }
  } catch (error) {
    results.push({
      service: 'Database (Turso)',
      status: 'unhealthy',
      message: 'Connection failed',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        configured: dbUrlVar.status === 'configured' && dbTokenVar.status === 'configured'
      },
      required: true
    });
  }
  
  // 2. Check Email Service Configuration
  console.log('📧 Checking Email Service...');
  const emailProvider = checkEnvVar(
    'EMAIL_PROVIDER',
    false,
    (val) => ['gmail', 'sendgrid'].includes(val.toLowerCase()),
    'Set to either "gmail" or "sendgrid"'
  );
  environmentVars.push(emailProvider);
  
  const provider = process.env.EMAIL_PROVIDER || import.meta.env.EMAIL_PROVIDER || 'gmail';
  
  if (provider.toLowerCase() === 'gmail') {
    const gmailUser = checkEnvVar(
      'GMAIL_USER',
      true,
      (val) => val.includes('@'),
      'Your Gmail email address'
    );
    const gmailPass = checkEnvVar(
      'GMAIL_PASS',
      true,
      (val) => val.length >= 16,
      'Generate App Password from Google Account settings'
    );
    environmentVars.push(gmailUser, gmailPass);
    
    // Test Gmail connection
    try {
      const emailService = EmailService.createFromEnv();
      const verifyResult = await emailService.verify();
      
      results.push({
        service: 'Email (Gmail)',
        status: verifyResult.success ? 'healthy' : 'unhealthy',
        message: verifyResult.message,
        details: { 
          provider: 'Gmail SMTP',
          configured: gmailUser.status === 'configured' && gmailPass.status === 'configured'
        },
        required: true
      });
    } catch (error) {
      results.push({
        service: 'Email (Gmail)',
        status: 'unhealthy',
        message: 'Gmail configuration failed',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Check GMAIL_USER and GMAIL_PASS (App Password)'
        },
        required: true
      });
    }
  } else if (provider.toLowerCase() === 'sendgrid') {
    const sendgridKey = checkEnvVar(
      'SENDGRID_API_KEY',
      true,
      (val) => val.startsWith('SG.'),
      'Must start with "SG." - Get from SendGrid dashboard'
    );
    const sendgridFrom = checkEnvVar(
      'SENDGRID_FROM_EMAIL',
      false,
      (val) => val.includes('@'),
      'Must be a verified sender in SendGrid'
    );
    environmentVars.push(sendgridKey, sendgridFrom);
    
    // Test SendGrid connection
    try {
      const emailService = EmailService.createFromEnv();
      const verifyResult = await emailService.verify();
      
      results.push({
        service: 'Email (SendGrid)',
        status: verifyResult.success ? 'healthy' : 'unhealthy',
        message: verifyResult.message,
        details: { 
          provider: 'SendGrid',
          configured: sendgridKey.status === 'configured'
        },
        required: true
      });
    } catch (error) {
      results.push({
        service: 'Email (SendGrid)',
        status: 'unhealthy',
        message: 'SendGrid configuration failed',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Check SENDGRID_API_KEY and verified senders'
        },
        required: true
      });
    }
  }
  
  // 3. Check Payment Service (Square)
  console.log('💳 Checking Payment Service...');
  const squareAppId = checkEnvVar(
    'SQUARE_APPLICATION_ID',
    false,
    undefined,
    'Get from Square Developer Dashboard'
  );
  const squareToken = checkEnvVar(
    'SQUARE_ACCESS_TOKEN',
    false,
    undefined,
    'Generate from Square Developer Dashboard'
  );
  const squareEnv = checkEnvVar(
    'SQUARE_ENVIRONMENT',
    false,
    (val) => ['sandbox', 'production'].includes(val),
    'Set to "sandbox" for testing or "production" for live'
  );
  environmentVars.push(squareAppId, squareToken, squareEnv);
  
  if (squareAppId.status === 'configured' && squareToken.status === 'configured') {
    try {
      const paymentService = new SquarePaymentService();
      // We can't fully test without making an API call, but we can check config
      results.push({
        service: 'Payment (Square)',
        status: 'healthy',
        message: 'Configuration present',
        details: { 
          environment: squareEnv.value || 'sandbox',
          configured: true
        },
        required: false
      });
    } catch (error) {
      results.push({
        service: 'Payment (Square)',
        status: 'degraded',
        message: 'Configuration may be incomplete',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        required: false
      });
    }
  } else {
    results.push({
      service: 'Payment (Square)',
      status: 'degraded',
      message: 'Not configured',
      details: { 
        note: 'Payment processing unavailable',
        recommendation: 'Configure Square credentials for payment processing'
      },
      required: false
    });
  }
  
  // 4. Check JWT Configuration
  console.log('🔐 Checking JWT Configuration...');
  const jwtSecret = checkEnvVar(
    'JWT_SECRET',
    true,
    (val) => val.length >= 32,
    'Use a strong secret at least 32 characters long'
  );
  environmentVars.push(jwtSecret);
  
  results.push({
    service: 'JWT Authentication',
    status: jwtSecret.status === 'configured' ? 'healthy' : 'unhealthy',
    message: jwtSecret.status === 'configured' ? 'JWT secret configured' : 'JWT secret missing or invalid',
    details: { 
      configured: jwtSecret.status === 'configured',
      lengthOk: jwtSecret.value ? jwtSecret.value.length >= 32 : false
    },
    required: true
  });
  
  // 5. Check App URL Configuration
  console.log('🌐 Checking App URL...');
  const appUrl = checkEnvVar(
    'PUBLIC_APP_URL',
    false,
    (val) => val.startsWith('http://') || val.startsWith('https://'),
    'Should be full URL like https://yourdomain.com'
  );
  environmentVars.push(appUrl);
  
  results.push({
    service: 'App URL',
    status: appUrl.status === 'configured' ? 'healthy' : 'degraded',
    message: appUrl.status === 'configured' ? 'App URL configured' : 'Using default localhost',
    details: { 
      url: appUrl.value || 'http://localhost:3000',
      configured: appUrl.status === 'configured'
    },
    required: false
  });
  
  // Calculate overall health
  const criticalServices = results.filter(r => r.required);
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;
  const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
  const criticalUnhealthy = criticalServices.filter(r => r.status === 'unhealthy').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (criticalUnhealthy > 0) {
    overallStatus = 'unhealthy';
  } else if (unhealthyCount > 0 || degradedCount > 2) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  // Prepare response
  const response = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    status: overallStatus,
    summary: {
      total: results.length,
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      criticalIssues: criticalUnhealthy
    },
    services: results,
    configuration: {
      variables: environmentVars,
      missing: environmentVars.filter(v => v.status === 'missing' && v.required),
      invalid: environmentVars.filter(v => v.status === 'invalid')
    },
    recommendations: getRecommendations(results, environmentVars),
    responseTime: `${Date.now() - startTime}ms`
  };
  
  // Set appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  
  return new Response(
    JSON.stringify(response, null, 2),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
};

function getRecommendations(results: HealthCheckResult[], envVars: EnvironmentVariable[]): string[] {
  const recommendations: string[] = [];
  
  const missingRequired = envVars.filter(v => v.status === 'missing' && v.required);
  const invalidVars = envVars.filter(v => v.status === 'invalid');
  
  if (missingRequired.length > 0) {
    recommendations.push(`⚠️ Missing required environment variables: ${missingRequired.map(v => v.name).join(', ')}`);
    recommendations.push('📝 Create a .env.local file with the required variables');
  }
  
  if (invalidVars.length > 0) {
    recommendations.push(`❌ Invalid environment variables: ${invalidVars.map(v => v.name).join(', ')}`);
    invalidVars.forEach(v => {
      if (v.recommendation) {
        recommendations.push(`   • ${v.name}: ${v.recommendation}`);
      }
    });
  }
  
  const unhealthyServices = results.filter(r => r.status === 'unhealthy' && r.required);
  if (unhealthyServices.length > 0) {
    recommendations.push('🔧 Critical services need attention:');
    unhealthyServices.forEach(s => {
      recommendations.push(`   • ${s.service}: ${s.message}`);
      if (s.details?.recommendation) {
        recommendations.push(`     → ${s.details.recommendation}`);
      }
    });
  }
  
  const emailService = results.find(r => r.service.includes('Email'));
  if (emailService?.status === 'unhealthy') {
    recommendations.push('📧 Email service setup guide:');
    recommendations.push('   • For Gmail: Enable 2FA and generate an App Password');
    recommendations.push('   • For SendGrid: Verify sender identity and check API key');
    recommendations.push('   • Run: npm run test:email to diagnose issues');
  }
  
  const dbService = results.find(r => r.service.includes('Database'));
  if (dbService?.status === 'unhealthy') {
    recommendations.push('🗄️ Database setup guide:');
    recommendations.push('   • Install Turso CLI: curl -sSfL https://get.tur.so/install.sh | bash');
    recommendations.push('   • Create database: turso db create blessbox');
    recommendations.push('   • Get credentials: turso db show blessbox');
    recommendations.push('   • Generate token: turso db tokens create blessbox');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operational! Your deployment is ready.');
  }
  
  return recommendations;
}