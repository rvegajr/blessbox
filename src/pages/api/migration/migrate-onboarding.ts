// API endpoint for migrating onboarding data from sessionStorage to database
import type { APIRoute } from 'astro';
import { DataMigrationService } from '../../../implementations/migration/DataMigrationService';
import { OrganizationRepository } from '../../../implementations/repositories/OrganizationRepository';
import { QRCodeRepository } from '../../../implementations/repositories/QRCodeRepository';
import { withSecurity } from '../../../middleware/security';
import type { OnboardingSessionData } from '../../../interfaces/migration/IDataMigration';

// Mock QR Code Repository for now
class MockQRCodeRepository {
  private qrCodeSets = new Map<string, any>();

  async create(data: any): Promise<any> {
    const id = `qr-set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const qrCodeSet = {
      id,
      ...data,
      isActive: true,
      scanCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.qrCodeSets.set(id, qrCodeSet);
    console.log(`📝 Mock: Created QR code set ${qrCodeSet.name} (${id})`);
    return qrCodeSet;
  }

  async findByOrganizationId(organizationId: string): Promise<any[]> {
    return Array.from(this.qrCodeSets.values()).filter(
      qrSet => qrSet.organizationId === organizationId
    );
  }
}

const organizationRepo = new OrganizationRepository();
const qrCodeRepo = new QRCodeRepository();
const migrationService = new DataMigrationService(organizationRepo, qrCodeRepo);

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      const body = await request.json();
      const { sessionData }: { sessionData: OnboardingSessionData } = body;

      if (!sessionData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Session data is required',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if migration is needed
      if (!migrationService.needsMigration(sessionData)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Data is not ready for migration. Complete onboarding first.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Migrate organization data
      const orgMigrationResult = await migrationService.migrateOnboardingData(sessionData);
      
      if (!orgMigrationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Organization migration failed',
            details: orgMigrationResult.errors,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      let qrMigrationResult = null;

      // Migrate QR code data if available
      if (sessionData.qrCodes && sessionData.qrCodes.length > 0) {
        qrMigrationResult = await migrationService.migrateQRCodeData(
          orgMigrationResult.organizationId!,
          sessionData.qrCodes
        );

        if (!qrMigrationResult.success) {
          console.warn('QR code migration failed:', qrMigrationResult.errors);
          // Don't fail the entire migration if QR codes fail
        }
      }

      // Get final migration status
      const migrationStatus = await migrationService.getMigrationStatus(
        orgMigrationResult.organizationId!
      );

      console.log(`✅ Migration completed for organization: ${orgMigrationResult.organizationId}`);
      if (orgMigrationResult.organizationId) {
        console.log(`[Migration] Organization created: ${orgMigrationResult.organizationId} (${sessionData.organizationName} / ${sessionData.contactEmail})`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Data migration completed successfully',
          organizationId: orgMigrationResult.organizationId,
          qrCodeSetId: qrMigrationResult?.qrCodeSetId,
          migrationStatus,
          warnings: [
            ...(orgMigrationResult.warnings || []),
            ...(qrMigrationResult?.warnings || []),
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      console.error('Migration API error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Migration failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });
};