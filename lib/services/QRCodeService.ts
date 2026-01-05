import { getDbClient } from '../db';
import type {
  IQRCodeService,
  QRCode,
  QRCodeSet,
  QRCodeUpdate,
  QRCodeAnalytics,
} from '../interfaces/IQRCodeService';

export class QRCodeService implements IQRCodeService {
  private db = getDbClient();

  async listQRCodes(organizationId: string): Promise<QRCode[]> {
    // Get all QR code sets for this organization
    const qrSetResult = await this.db.execute({
      sql: `
        SELECT id, qr_codes, is_active, scan_count, created_at, updated_at
        FROM qr_code_sets
        WHERE organization_id = ? AND is_active = 1
        ORDER BY created_at DESC
      `,
      args: [organizationId],
    });

    if (qrSetResult.rows.length === 0) {
      return [];
    }

    const allQRCodes: QRCode[] = [];

    // Parse QR codes from each set
    for (const qrSet of qrSetResult.rows) {
      const qrSetRow = qrSet as any;
      const qrCodesData = JSON.parse(qrSetRow.qr_codes || '[]');
      const qrSetId = qrSetRow.id;

      for (const qrCodeData of qrCodesData) {
        // Count registrations for this QR code
        const regCountResult = await this.db.execute({
          sql: `
            SELECT COUNT(*) as count
            FROM registrations
            WHERE qr_code_id = ? AND qr_code_set_id = ?
          `,
          args: [qrCodeData.id, qrSetId],
        });

        const registrationCount = (regCountResult.rows[0] as any)?.count || 0;

        allQRCodes.push({
          id: qrCodeData.id,
          qrCodeSetId: qrSetId,
          label: qrCodeData.label,
          slug: qrCodeData.slug || qrCodeData.label.toLowerCase().replace(/\s+/g, '-'),
          url: qrCodeData.url,
          dataUrl: qrCodeData.dataUrl || '',
          description: qrCodeData.description || undefined,
          isActive: true, // QR codes inherit active status from set
          // Fix: Use per-QR-code registration count, not set-level scan_count
          // Each QR code should show its own scan count based on registrations
          scanCount: registrationCount,
          registrationCount,
          createdAt: qrCodeData.createdAt || qrSetRow.created_at,
          updatedAt: qrSetRow.updated_at,
        });
      }
    }

    return allQRCodes;
  }

  async getQRCodesBySet(qrCodeSetId: string): Promise<QRCode[]> {
    const qrSetResult = await this.db.execute({
      sql: `
        SELECT id, qr_codes, is_active, scan_count, created_at, updated_at
        FROM qr_code_sets
        WHERE id = ?
      `,
      args: [qrCodeSetId],
    });

    if (qrSetResult.rows.length === 0) {
      return [];
    }

    const qrSet = qrSetResult.rows[0] as any;
    const qrCodesData = JSON.parse(qrSet.qr_codes || '[]');
    const qrCodes: QRCode[] = [];

    for (const qrCodeData of qrCodesData) {
      // Count registrations for this QR code
      const regCountResult = await this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations
          WHERE qr_code_id = ? AND qr_code_set_id = ?
        `,
        args: [qrCodeData.id, qrCodeSetId],
      });

      const registrationCount = (regCountResult.rows[0] as any)?.count || 0;

      qrCodes.push({
        id: qrCodeData.id,
        qrCodeSetId,
        label: qrCodeData.label,
        slug: qrCodeData.slug || qrCodeData.label.toLowerCase().replace(/\s+/g, '-'),
        url: qrCodeData.url,
        dataUrl: qrCodeData.dataUrl || '',
        description: qrCodeData.description || undefined,
        isActive: qrCodeData.isActive !== undefined ? qrCodeData.isActive : (qrSet.is_active === 1),
        scanCount: qrSet.scan_count || 0,
        registrationCount,
        createdAt: qrCodeData.createdAt || qrSet.created_at,
        updatedAt: qrSet.updated_at,
      });
    }

    return qrCodes;
  }

  async getQRCode(id: string, qrCodeSetId: string): Promise<QRCode | null> {
    const qrCodes = await this.getQRCodesBySet(qrCodeSetId);
    return qrCodes.find((qr) => qr.id === id) || null;
  }

  async updateQRCode(
    id: string,
    qrCodeSetId: string,
    updates: QRCodeUpdate
  ): Promise<QRCode> {
    // Get current QR code set
    const qrSetResult = await this.db.execute({
      sql: `SELECT id, qr_codes, updated_at FROM qr_code_sets WHERE id = ?`,
      args: [qrCodeSetId],
    });

    if (qrSetResult.rows.length === 0) {
      throw new Error('QR code set not found');
    }

    const qrSet = qrSetResult.rows[0] as any;
    const qrCodesData = JSON.parse(qrSet.qr_codes || '[]');

    // Find and update the QR code
    const qrCodeIndex = qrCodesData.findIndex((qr: any) => qr.id === id);
    if (qrCodeIndex === -1) {
      throw new Error('QR code not found');
    }

    // Apply updates
    // SAFETY: do not allow changing the URL segment (label/slug/url) from this update path.
    // If a client sends `label`, treat it as a request to set the human-friendly display name.
    if (updates.description !== undefined) {
      qrCodesData[qrCodeIndex].description = updates.description;
    } else if (updates.label !== undefined) {
      qrCodesData[qrCodeIndex].description = updates.label;
    }

    if (updates.isActive !== undefined) {
      // Note: Individual QR codes don't have isActive in the stored data
      // We could add this field if needed, or handle it differently
      // For now, we'll skip this update or store it in a metadata field
      qrCodesData[qrCodeIndex].isActive = updates.isActive;
    }

    // Update the QR code set
    const now = new Date().toISOString();
    await this.db.execute({
      sql: `UPDATE qr_code_sets SET qr_codes = ?, updated_at = ? WHERE id = ?`,
      args: [JSON.stringify(qrCodesData), now, qrCodeSetId],
    });

    // Return updated QR code
    const updatedQRCode = await this.getQRCode(id, qrCodeSetId);
    if (!updatedQRCode) {
      throw new Error('Failed to retrieve updated QR code');
    }

    return updatedQRCode;
  }

  async deleteQRCode(id: string, qrCodeSetId: string): Promise<void> {
    // Delete is implemented as setting isActive to false
    await this.updateQRCode(id, qrCodeSetId, { isActive: false });
  }

  async downloadQRCode(id: string, qrCodeSetId: string): Promise<string> {
    const qrCode = await this.getQRCode(id, qrCodeSetId);
    if (!qrCode) {
      throw new Error('QR code not found');
    }

    return qrCode.dataUrl;
  }

  async getQRCodeAnalytics(
    id: string,
    qrCodeSetId: string
  ): Promise<QRCodeAnalytics> {
    const qrCode = await this.getQRCode(id, qrCodeSetId);
    if (!qrCode) {
      throw new Error('QR code not found');
    }

    // Get QR code set for scan count
    const qrSetResult = await this.db.execute({
      sql: `SELECT scan_count FROM qr_code_sets WHERE id = ?`,
      args: [qrCodeSetId],
    });

    const scanCount = qrSetResult.rows.length > 0
      ? ((qrSetResult.rows[0] as any).scan_count || 0)
      : 0;

    // Count registrations
    const regCountResult = await this.db.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM registrations
        WHERE qr_code_id = ? AND qr_code_set_id = ?
      `,
      args: [id, qrCodeSetId],
    });

    const registrationCount = regCountResult.rows.length > 0
      ? ((regCountResult.rows[0] as any).count || 0)
      : 0;

    // Get last registration date
    const lastRegResult = await this.db.execute({
      sql: `
        SELECT registered_at
        FROM registrations
        WHERE qr_code_id = ? AND qr_code_set_id = ?
        ORDER BY registered_at DESC
        LIMIT 1
      `,
      args: [id, qrCodeSetId],
    });

    const lastRegistration = lastRegResult.rows.length > 0
      ? (lastRegResult.rows[0] as any).registered_at
      : undefined;

    return {
      scanCount,
      registrationCount,
      lastRegistration,
    };
  }

  async getQRCodeSets(organizationId: string): Promise<QRCodeSet[]> {
    const result = await this.db.execute({
      sql: `
        SELECT id, organization_id, name, language, is_active, scan_count, created_at, updated_at
        FROM qr_code_sets
        WHERE organization_id = ?
        ORDER BY created_at DESC
      `,
      args: [organizationId],
    });

    return result.rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      language: row.language,
      isActive: row.is_active === 1,
      scanCount: row.scan_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getQRCodeSet(id: string): Promise<QRCodeSet | null> {
    const result = await this.db.execute({
      sql: `
        SELECT id, organization_id, name, language, is_active, scan_count, created_at, updated_at
        FROM qr_code_sets
        WHERE id = ?
      `,
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      language: row.language,
      isActive: row.is_active === 1,
      scanCount: row.scan_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateQRCodeSet(
    id: string,
    updates: { name?: string; isActive?: boolean }
  ): Promise<QRCodeSet> {
    // Get current QR code set
    const current = await this.getQRCodeSet(id);
    if (!current) {
      throw new Error('QR code set not found');
    }

    const setClause: string[] = [];
    const args: any[] = [];

    if (updates.name !== undefined) {
      setClause.push('name = ?');
      args.push(updates.name);
    }

    if (updates.isActive !== undefined) {
      setClause.push('is_active = ?');
      args.push(updates.isActive ? 1 : 0);
    }

    if (setClause.length === 0) {
      return current;
    }

    // Add updated_at
    const now = new Date().toISOString();
    setClause.push('updated_at = ?');
    args.push(now);
    args.push(id);

    await this.db.execute({
      sql: `UPDATE qr_code_sets SET ${setClause.join(', ')} WHERE id = ?`,
      args,
    });

    const updated = await this.getQRCodeSet(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated QR code set');
    }

    return updated;
  }
}

