// TDD Implementation: Data Migration Service
import type { 
  IDataMigration, 
  OnboardingSessionData, 
  QRCodeSessionData,
  MigrationResult,
  MigrationStatus,
  FormFieldData
} from '../../interfaces/migration/IDataMigration';
import type { IOrganizationRepository } from '../../interfaces/database/IOrganizationRepository';
import type { IQRCodeRepository } from '../../interfaces/database/IQRCodeRepository';

export class DataMigrationService implements IDataMigration {
  constructor(
    private organizationRepo: IOrganizationRepository,
    private qrCodeRepo: IQRCodeRepository
  ) {}

  needsMigration(sessionData: OnboardingSessionData): boolean {
    // Check if onboarding is complete and email is verified
    return !!(
      sessionData.onboardingComplete &&
      sessionData.emailVerified &&
      sessionData.organizationName &&
      sessionData.contactEmail
    );
  }

  async migrateOnboardingData(sessionData: OnboardingSessionData): Promise<MigrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required fields
      if (!sessionData.contactEmail) {
        errors.push('Contact email is required');
      }
      if (!sessionData.organizationName) {
        errors.push('Organization name is required');
      }

      if (errors.length > 0) {
        return { success: false, errors, warnings };
      }

      // Check if organization already exists
      let organization = await this.organizationRepo.findByEmail(sessionData.contactEmail);

      if (organization) {
        // Organization exists, check if email verification needs updating
        if (sessionData.emailVerified && !organization.emailVerified) {
          await this.organizationRepo.markEmailVerified(organization.id);
          warnings.push('Email verification status updated');
        }
        
        warnings.push('Organization already exists in database');
        return {
          success: true,
          organizationId: organization.id,
          warnings,
        };
      }

      // Create new organization
      organization = await this.organizationRepo.create({
        name: sessionData.organizationName,
        eventName: sessionData.eventName,
        customDomain: sessionData.customDomain,
        contactEmail: sessionData.contactEmail,
        contactPhone: sessionData.contactPhone,
        contactAddress: sessionData.contactAddress,
        contactCity: sessionData.contactCity,
        contactState: sessionData.contactState,
        contactZip: sessionData.contactZip,
      });

      // Mark email as verified if session indicates it's verified
      if (sessionData.emailVerified) {
        await this.organizationRepo.markEmailVerified(organization.id);
      }

      return {
        success: true,
        organizationId: organization.id,
        warnings,
      };

    } catch (error) {
      console.error('Organization migration error:', error);
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors, warnings };
    }
  }

  async migrateQRCodeData(organizationId: string, qrData: QRCodeSessionData[]): Promise<MigrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!qrData || qrData.length === 0) {
        errors.push('No QR codes to migrate');
        return { success: false, errors, warnings };
      }

      // Create default form fields (can be customized later)
      const defaultFormFields: FormFieldData[] = [
        {
          id: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email',
          required: true,
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone Number',
          placeholder: 'Enter your phone number',
          required: false,
        },
        {
          id: 'familySize',
          type: 'number',
          label: 'Family Size',
          placeholder: 'Number of family members',
          required: false,
        },
      ];

      // Determine the primary language from QR codes
      const primaryLanguage = qrData[0]?.language || 'en';

      // Create QR code set
      const qrCodeSet = await this.qrCodeRepo.create({
        organizationId,
        name: `${new Date().getFullYear()} QR Codes`,
        language: primaryLanguage,
        formFields: defaultFormFields,
        qrCodes: qrData.map(qr => ({
          id: qr.id,
          label: qr.label,
          url: qr.url,
          dataUrl: qr.dataUrl,
          language: qr.language,
          scanCount: 0,
        })),
      });

      return {
        success: true,
        organizationId,
        qrCodeSetId: qrCodeSet.id,
        warnings,
      };

    } catch (error) {
      console.error('QR code migration error:', error);
      errors.push(`QR code migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors, warnings };
    }
  }

  cleanupSessionData(): void {
    // Clear sessionStorage data after successful migration
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keysToRemove = [
        'blessbox_onboarding_data',
        'blessbox_qr_config',
        'blessbox_form_fields',
        'blessbox_verification_token',
      ];

      keysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove session key ${key}:`, error);
        }
      });

      console.log('✅ Session data cleaned up after successful migration');
    }
  }

  async getMigrationStatus(organizationId: string): Promise<MigrationStatus> {
    try {
      // Check if organization exists (indicates migration happened)
      const organization = await this.organizationRepo.findById(organizationId);
      
      if (!organization) {
        return {
          isMigrated: false,
          hasQRCodes: false,
        };
      }

      // Check for QR code sets
      const qrCodeSets = await this.qrCodeRepo.findByOrganizationId(organizationId);
      const hasQRCodes = qrCodeSets.length > 0;

      return {
        isMigrated: true,
        migratedAt: organization.createdAt,
        organizationId: organization.id,
        qrCodeSetId: qrCodeSets[0]?.id,
        hasQRCodes,
        totalRegistrations: 0, // TODO: Implement when registration repo is available
      };

    } catch (error) {
      console.error('Migration status check error:', error);
      return {
        isMigrated: false,
        hasQRCodes: false,
      };
    }
  }
}