// 🌐 CUSTOM DOMAIN SERVICE - PURE ISP DOMAIN BLISS! ✨
// NO MOCKS! REAL DNS POWER! HARDENED DOMAIN MANAGEMENT! 💪

export interface ICustomDomainService {
  // 🚀 Set custom domain for organization
  setCustomDomain(organizationId: string, domain: string): Promise<DomainResult>;
  
  // 🔍 Verify domain ownership and DNS configuration
  verifyDomainConfiguration(organizationId: string): Promise<DomainVerificationResult>;
  
  // 📊 Get domain status and configuration
  getDomainStatus(organizationId: string): Promise<DomainStatus | null>;
  
  // 🔄 Update domain configuration
  updateDomainConfiguration(organizationId: string, config: DomainConfiguration): Promise<DomainResult>;
  
  // ❌ Remove custom domain
  removeCustomDomain(organizationId: string): Promise<DomainResult>;
  
  // 🌟 Generate QR codes with custom domain
  generateCustomDomainQRCodes(organizationId: string, qrCodeSetId: string): Promise<CustomDomainQRCode[]>;
}

export interface DomainResult {
  success: boolean;
  message: string;
  domain?: string;
  verificationRequired?: boolean;
  dnsRecords?: DNSRecord[];
  errors?: string[];
}

export interface DomainVerificationResult {
  verified: boolean;
  domain: string;
  checks: DomainCheck[];
  lastChecked: Date;
  nextCheckAt?: Date;
}

export interface DomainCheck {
  type: 'CNAME' | 'TXT' | 'A' | 'SSL';
  name: string;
  expectedValue: string;
  actualValue?: string;
  status: 'pending' | 'verified' | 'failed';
  message: string;
}

export interface DomainStatus {
  domain: string;
  status: 'pending' | 'verifying' | 'verified' | 'failed' | 'suspended';
  verificationMethod: 'DNS' | 'FILE';
  sslStatus: 'pending' | 'issued' | 'failed' | 'expired';
  sslExpiry?: Date;
  lastVerified?: Date;
  configuration: DomainConfiguration;
  dnsRecords: DNSRecord[];
  healthCheck: DomainHealthCheck;
}

export interface DomainConfiguration {
  subdirectory?: string; // e.g., /register
  redirectHttps: boolean;
  customHeaders?: Record<string, string>;
  cacheSettings?: CacheSettings;
  securitySettings?: SecuritySettings;
}

export interface CacheSettings {
  enabled: boolean;
  ttl: number; // seconds
  varyByHeaders?: string[];
}

export interface SecuritySettings {
  hsts: boolean;
  contentSecurityPolicy?: string;
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  xssProtection: boolean;
}

export interface DNSRecord {
  type: 'CNAME' | 'TXT' | 'A';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  status: 'required' | 'optional' | 'configured' | 'invalid';
}

export interface DomainHealthCheck {
  lastCheck: Date;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number; // milliseconds
  httpStatus: number;
  sslValid: boolean;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'dns' | 'ssl' | 'connectivity' | 'performance';
  message: string;
  resolution?: string;
}

export interface CustomDomainQRCode {
  id: string;
  label: string;
  customUrl: string; // Using custom domain
  fallbackUrl: string; // Using blessbox.app
  qrCodeImage: string; // Base64 encoded
  entryPoints?: EntryPointQRCode[];
}

export interface EntryPointQRCode {
  entryPoint: string;
  customUrl: string;
  qrCodeImage: string;
}