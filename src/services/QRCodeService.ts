import type { 
  QRCodeConfig, 
  QRCodeSet, 
  QRCodeRegistration, 
  QRCodeAnalytics, 
  RequiredField,
  OrganizationQRSettings 
} from '../interfaces/QRCode.js';

export class QRCodeService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new QR code set with multiple QR codes
   */
  async createQRCodeSet(config: {
    name: string;
    description?: string;
    organizationId: string;
    eventType: string;
    eventName: string;
    requiredFields: RequiredField[];
    qrCodeLabels: string[];
  }): Promise<QRCodeSet> {
    const qrCodes: QRCodeConfig[] = config.qrCodeLabels.map((label, index) => ({
      id: this.generateId(),
      label: label.trim() || undefined,
      eventType: config.eventType as any,
      eventName: config.eventName,
      organizationId: config.organizationId,
      requiredFields: config.requiredFields,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      registrationUrl: this.generateRegistrationUrl(config.organizationId, config.eventName, index),
      totalScans: 0,
      totalRegistrations: 0,
    }));

    const qrCodeSet: QRCodeSet = {
      id: this.generateId(),
      name: config.name,
      description: config.description,
      organizationId: config.organizationId,
      eventType: config.eventType as any,
      eventName: config.eventName,
      requiredFields: config.requiredFields,
      qrCodes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalRegistrations: 0,
    };

    // In a real implementation, this would save to a database
    // For now, we'll simulate the API response
    return qrCodeSet;
  }

  /**
   * Generate QR codes for a set
   */
  async generateQRCodes(qrCodeSetId: string): Promise<{ qrCodeId: string; qrCodeUrl: string; label?: string }[]> {
    // In a real implementation, this would generate actual QR codes
    // using a library like qrcode or similar
    const mockQRCodes = [
      { qrCodeId: 'qr-1', qrCodeUrl: 'data:image/png;base64,mock-qr-1', label: 'Main Entrance' },
      { qrCodeId: 'qr-2', qrCodeUrl: 'data:image/png;base64,mock-qr-2', label: 'Side Door' },
    ];

    return mockQRCodes;
  }

  /**
   * Get QR code sets for an organization
   */
  async getQRCodeSets(organizationId: string): Promise<QRCodeSet[]> {
    // Mock data for demonstration
    return [
      {
        id: 'set-1',
        name: 'Weekly Food Distribution',
        description: 'Main food distribution event',
        organizationId,
        eventType: 'food-donation',
        eventName: 'Weekly Food Distribution',
        requiredFields: [
          {
            id: 'name',
            name: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name',
          },
          {
            id: 'phone',
            name: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            placeholder: '(555) 123-4567',
          },
          {
            id: 'family-size',
            name: 'familySize',
            type: 'select',
            label: 'Family Size',
            required: false,
            options: ['1-2 people', '3-4 people', '5+ people'],
          },
        ],
        qrCodes: [
          {
            id: 'qr-1',
            label: 'Main Entrance',
            eventType: 'food-donation',
            eventName: 'Weekly Food Distribution',
            organizationId,
            requiredFields: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            registrationUrl: `/register/${organizationId}/weekly-food-distribution/0`,
            totalScans: 45,
            totalRegistrations: 38,
          },
          {
            id: 'qr-2',
            label: 'Side Door',
            eventType: 'food-donation',
            eventName: 'Weekly Food Distribution',
            organizationId,
            requiredFields: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            registrationUrl: `/register/${organizationId}/weekly-food-distribution/1`,
            totalScans: 32,
            totalRegistrations: 29,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalRegistrations: 67,
      },
    ];
  }

  /**
   * Get registrations for a QR code set
   */
  async getRegistrations(qrCodeSetId: string): Promise<QRCodeRegistration[]> {
    // Mock data for demonstration
    return [
      {
        id: 'reg-1',
        qrCodeId: 'qr-1',
        qrCodeLabel: 'Main Entrance',
        registrationData: {
          name: 'Maria Rodriguez',
          phone: '(555) 123-4567',
          familySize: '3-4 people',
        },
        submittedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        registrationTimestamp: new Date(Date.now() - 1000 * 60 * 30), // Registered 30 minutes ago
        verified: true,
        verifiedAt: new Date(Date.now() - 1000 * 60 * 25),
        verifiedBy: 'staff-1',
        distributed: true,
        distributedAt: new Date(Date.now() - 1000 * 60 * 20), // Distributed 20 minutes ago
        distributedBy: 'staff-1',
      },
      {
        id: 'reg-2',
        qrCodeId: 'qr-2',
        qrCodeLabel: 'Side Door',
        registrationData: {
          name: 'James Wilson',
          phone: '(555) 987-6543',
          familySize: '1-2 people',
        },
        submittedAt: new Date(Date.now() - 1000 * 60 * 13), // 13 minutes ago
        registrationTimestamp: new Date(Date.now() - 1000 * 60 * 13), // Registered 13 minutes ago
        verified: true,
        verifiedAt: new Date(Date.now() - 1000 * 60 * 10),
        verifiedBy: 'staff-1',
        distributed: false,
        distributedAt: undefined,
        distributedBy: undefined,
      },
      {
        id: 'reg-3',
        qrCodeId: 'qr-1',
        qrCodeLabel: 'Main Entrance',
        registrationData: {
          name: 'Sarah Chen',
          phone: '(555) 456-7890',
          familySize: '3-4 people',
        },
        submittedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        registrationTimestamp: new Date(Date.now() - 1000 * 60 * 5), // Registered 5 minutes ago
        verified: true,
        verifiedAt: new Date(Date.now() - 1000 * 60 * 2),
        verifiedBy: 'staff-2',
        distributed: false,
        distributedAt: undefined,
        distributedBy: undefined,
      },
    ];
  }

  /**
   * Get analytics for QR codes
   */
  async getAnalytics(qrCodeSetId: string): Promise<QRCodeAnalytics[]> {
    // Mock analytics data
    return [
      {
        qrCodeId: 'qr-1',
        qrCodeLabel: 'Main Entrance',
        totalScans: 45,
        totalRegistrations: 38,
        conversionRate: 84.4,
        scansByHour: [
          { hour: '09:00', scans: 5, registrations: 4 },
          { hour: '10:00', scans: 12, registrations: 10 },
          { hour: '11:00', scans: 15, registrations: 13 },
          { hour: '12:00', scans: 13, registrations: 11 },
        ],
        scansByDay: [
          { date: '2024-01-15', scans: 45, registrations: 38 },
        ],
        topDevices: [
          { device: 'iPhone', count: 28 },
          { device: 'Android', count: 17 },
        ],
      },
      {
        qrCodeId: 'qr-2',
        qrCodeLabel: 'Side Door',
        totalScans: 32,
        totalRegistrations: 29,
        conversionRate: 90.6,
        scansByHour: [
          { hour: '09:00', scans: 3, registrations: 3 },
          { hour: '10:00', scans: 8, registrations: 7 },
          { hour: '11:00', scans: 12, registrations: 11 },
          { hour: '12:00', scans: 9, registrations: 8 },
        ],
        scansByDay: [
          { date: '2024-01-15', scans: 32, registrations: 29 },
        ],
        topDevices: [
          { device: 'iPhone', count: 18 },
          { device: 'Android', count: 14 },
        ],
      },
    ];
  }

  /**
   * Update organization QR settings
   */
  async updateOrganizationSettings(settings: OrganizationQRSettings): Promise<OrganizationQRSettings> {
    // In a real implementation, this would save to a database
    return settings;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Generate registration URL
   */
  private generateRegistrationUrl(organizationId: string, eventName: string, index: number): string {
    const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `/register/${organizationId}/${slug}/${index}`;
  }

  /**
   * Validate QR code configuration
   */
  validateQRCodeConfig(config: Partial<QRCodeConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.eventName || config.eventName.trim().length === 0) {
      errors.push('Event name is required');
    }

    if (!config.eventType) {
      errors.push('Event type is required');
    }

    if (!config.organizationId) {
      errors.push('Organization ID is required');
    }

    if (!config.requiredFields || config.requiredFields.length === 0) {
      errors.push('At least one required field must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export a singleton instance
export const qrCodeService = new QRCodeService();