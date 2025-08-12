import { eq } from 'drizzle-orm';
import { getDatabase, createDatabaseConnection } from '../../database/connection';
import { qrCodeSets } from '../../database/schema';
import type {
  IQRCodeRepository,
  CreateQRCodeSetData,
  QRCodeSet,
} from '../../interfaces/database/IQRCodeRepository';

export class QRCodeRepository implements IQRCodeRepository {
  private db = getDatabase();

  async create(data: CreateQRCodeSetData): Promise<QRCodeSet> {
    await createDatabaseConnection();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.insert(qrCodeSets).values({
      id,
      organizationId: data.organizationId,
      name: data.name,
      language: data.language,
      formFields: JSON.stringify(data.formFields as any),
      qrCodes: JSON.stringify(data.qrCodes as any),
      isActive: true,
      scanCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await this.db
      .select()
      .from(qrCodeSets)
      .where(eq(qrCodeSets.id, id))
      .limit(1);

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      language: row.language,
      formFields: JSON.parse(row.formFields as any),
      qrCodes: JSON.parse(row.qrCodes as any),
      isActive: !!row.isActive,
      scanCount: row.scanCount,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as QRCodeSet;
  }

  async findById(id: string): Promise<QRCodeSet | null> {
    await createDatabaseConnection();
    const [row] = await this.db
      .select()
      .from(qrCodeSets)
      .where(eq(qrCodeSets.id, id))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      language: row.language,
      formFields: JSON.parse(row.formFields as any),
      qrCodes: JSON.parse(row.qrCodes as any),
      isActive: !!row.isActive,
      scanCount: row.scanCount,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as QRCodeSet;
  }

  async findByOrganizationId(organizationId: string): Promise<QRCodeSet[]> {
    await createDatabaseConnection();
    const rows = await this.db
      .select()
      .from(qrCodeSets)
      .where(eq(qrCodeSets.organizationId, organizationId));
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      language: row.language,
      formFields: JSON.parse(row.formFields as any),
      qrCodes: JSON.parse(row.qrCodes as any),
      isActive: !!row.isActive,
      scanCount: row.scanCount,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as QRCodeSet));
  }

  async update(): Promise<QRCodeSet> {
    throw new Error('Not implemented');
  }
  async updateStatus(): Promise<void> {
    throw new Error('Not implemented');
  }
  async delete(): Promise<void> {
    throw new Error('Not implemented');
  }
  async incrementScanCount(): Promise<void> {
    throw new Error('Not implemented');
  }
  async getAnalytics(): Promise<any> {
    throw new Error('Not implemented');
  }
}


