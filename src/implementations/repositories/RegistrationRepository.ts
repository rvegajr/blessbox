import { eq, and, count, desc } from 'drizzle-orm';
import { getDatabase, createDatabaseConnection } from '../../database/connection';
import { registrations, qrCodeSets } from '../../database/schema';
import type {
  IRegistrationRepository,
  CreateRegistrationData,
  Registration,
  DateRange,
  RegistrationStats,
} from '../../interfaces/database/IRegistrationRepository';

export class RegistrationRepository implements IRegistrationRepository {
  private db = getDatabase();

  async create(data: CreateRegistrationData): Promise<Registration> {
    await createDatabaseConnection();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(registrations).values({
      id,
      qrCodeSetId: data.qrCodeSetId,
      qrCodeId: data.qrCodeId,
      registrationData: JSON.stringify(data.registrationData),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referrer: data.referrer,
      deliveryStatus: 'pending',
      registeredAt: now,
    });

    const [row] = await this.db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1);

    return {
      id: row.id,
      qrCodeSetId: row.qrCodeSetId,
      qrCodeId: row.qrCodeId,
      registrationData: JSON.parse(row.registrationData as any),
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      referrer: row.referrer || undefined,
      registeredAt: new Date(row.registeredAt),
    };
  }

  async findById(id: string): Promise<Registration | null> {
    await createDatabaseConnection();
    const [row] = await this.db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      qrCodeSetId: row.qrCodeSetId,
      qrCodeId: row.qrCodeId,
      registrationData: JSON.parse(row.registrationData as any),
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      referrer: row.referrer || undefined,
      registeredAt: new Date(row.registeredAt),
    };
  }

  async findByQRCodeSetId(qrCodeSetId: string, limit = 50, offset = 0): Promise<Registration[]> {
    await createDatabaseConnection();
    const rows = await this.db
      .select()
      .from(registrations)
      .where(eq(registrations.qrCodeSetId, qrCodeSetId))
      .orderBy(desc(registrations.registeredAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      id: row.id,
      qrCodeSetId: row.qrCodeSetId,
      qrCodeId: row.qrCodeId,
      registrationData: JSON.parse(row.registrationData as any),
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      referrer: row.referrer || undefined,
      registeredAt: new Date(row.registeredAt),
    }));
  }

  async findByOrganizationId(organizationId: string, limit = 50, offset = 0): Promise<Registration[]> {
    await createDatabaseConnection();
    const rows = await this.db
      .select({
        id: registrations.id,
        qrCodeSetId: registrations.qrCodeSetId,
        qrCodeId: registrations.qrCodeId,
        registrationData: registrations.registrationData,
        ipAddress: registrations.ipAddress,
        userAgent: registrations.userAgent,
        referrer: registrations.referrer,
        registeredAt: registrations.registeredAt,
      })
      .from(registrations)
      .innerJoin(qrCodeSets, eq(registrations.qrCodeSetId, qrCodeSets.id))
      .where(eq(qrCodeSets.organizationId, organizationId))
      .orderBy(desc(registrations.registeredAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      id: row.id,
      qrCodeSetId: row.qrCodeSetId,
      qrCodeId: row.qrCodeId,
      registrationData: JSON.parse(row.registrationData as any),
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      referrer: row.referrer || undefined,
      registeredAt: new Date(row.registeredAt),
    }));
  }

  async countByQRCodeSetId(qrCodeSetId: string): Promise<number> {
    await createDatabaseConnection();
    const [result] = await this.db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.qrCodeSetId, qrCodeSetId));
    return result.count;
  }

  async countByOrganizationId(organizationId: string): Promise<number> {
    await createDatabaseConnection();
    const [result] = await this.db
      .select({ count: count() })
      .from(registrations)
      .innerJoin(qrCodeSets, eq(registrations.qrCodeSetId, qrCodeSets.id))
      .where(eq(qrCodeSets.organizationId, organizationId));
    return result.count;
  }

  async getRegistrationStats(organizationId: string, dateRange?: DateRange): Promise<RegistrationStats> {
    await createDatabaseConnection();
    
    // Get total registrations
    const totalCount = await this.countByOrganizationId(organizationId);

    // For now, return basic stats - can be enhanced later
    return {
      totalRegistrations: totalCount,
      registrationsByDate: [],
      registrationsByQRCode: [],
    };
  }

  async exportToCSV(qrCodeSetId: string): Promise<string> {
    const registrations = await this.findByQRCodeSetId(qrCodeSetId, 1000);
    
    if (registrations.length === 0) {
      return 'id,qrCodeId,registeredAt\n';
    }

    // Get all unique keys from registration data
    const allKeys = new Set<string>();
    registrations.forEach(reg => {
      Object.keys(reg.registrationData).forEach(key => allKeys.add(key));
    });

    const headers = ['id', 'qrCodeId', ...Array.from(allKeys), 'registeredAt'];
    const csvRows = [headers.join(',')];

    registrations.forEach(reg => {
      const row = [
        reg.id,
        reg.qrCodeId,
        ...Array.from(allKeys).map(key => reg.registrationData[key] || ''),
        reg.registeredAt.toISOString(),
      ];
      csvRows.push(row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
    });

    return csvRows.join('\n');
  }

  async exportToJSON(qrCodeSetId: string): Promise<Registration[]> {
    return await this.findByQRCodeSetId(qrCodeSetId, 1000);
  }

  async delete(id: string): Promise<void> {
    await createDatabaseConnection();
    await this.db
      .delete(registrations)
      .where(eq(registrations.id, id));
  }

  async deleteByEmail(email: string): Promise<number> {
    // This would need a more complex query to search within the JSON data
    // For now, returning 0 as placeholder
    return 0;
  }
}