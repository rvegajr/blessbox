import { eq, and, inArray, desc, asc, count, sql } from 'drizzle-orm';
import { getDatabase, createDatabaseConnection } from '../../database/connection';
import { registrations, qrCodeSets, organizations } from '../../database/schema';
import type {
  IRegistrationService,
  RegistrationData,
  RegistrationFilters,
  PaginationOptions,
  RegistrationListResult,
} from '../../interfaces/dashboard/IRegistrationService';

/**
 * Registration Service Implementation - ISP Compliant! 🎉
 * Handles ONLY registration-related operations with REAL database!
 * Following Interface Segregation Principle like a BOSS!
 */
export class RegistrationService implements IRegistrationService {
  
  private getDb() {
    createDatabaseConnection();
    return getDatabase();
  }
  
  /**
   * Get paginated list of registrations for an organization
   * This is the HEART of our dashboard! 💖
   */
  async getRegistrations(
    organizationId: string,
    filters?: RegistrationFilters,
    pagination: PaginationOptions = {
      page: 1,
      limit: 25,
      sortBy: 'registeredAt',
      sortOrder: 'desc',
    }
  ): Promise<RegistrationListResult> {
    try {
      // Build the base query with organization filter
      let whereConditions = [
        eq(qrCodeSets.organizationId, organizationId)
      ];

      // Apply filters like a CHAMPION! 🏆
      if (filters?.deliveryStatus && filters.deliveryStatus.length > 0) {
        whereConditions.push(inArray(registrations.deliveryStatus, filters.deliveryStatus));
      }

      if (filters?.qrCodeLabels && filters.qrCodeLabels.length > 0) {
        whereConditions.push(inArray(registrations.qrCodeId, filters.qrCodeLabels));
      }

      if (filters?.dateRange) {
        if (filters.dateRange.start) {
          whereConditions.push(sql`${registrations.registeredAt} >= ${filters.dateRange.start}`);
        }
        if (filters.dateRange.end) {
          whereConditions.push(sql`${registrations.registeredAt} <= ${filters.dateRange.end}`);
        }
      }

      // Get total count for pagination
      const [totalCountResult] = await this.getDb()
        .select({ count: count() })
        .from(registrations)
        .innerJoin(qrCodeSets, eq(registrations.qrCodeSetId, qrCodeSets.id))
        .where(and(...whereConditions));

      const totalCount = totalCountResult.count;

      // Calculate pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const totalPages = Math.ceil(totalCount / pagination.limit);

      // Build sort order
      const sortColumn = pagination.sortBy === 'registeredAt' 
        ? registrations.registeredAt
        : registrations.deliveryStatus;
      const sortOrder = pagination.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

      // Get the actual registrations with all the juicy details! 🥤
      const results = await this.getDb()
        .select({
          id: registrations.id,
          qrCodeSetId: registrations.qrCodeSetId,
          qrCodeId: registrations.qrCodeId,
          registrationData: registrations.registrationData,
          ipAddress: registrations.ipAddress,
          userAgent: registrations.userAgent,
          referrer: registrations.referrer,
          deliveryStatus: registrations.deliveryStatus,
          deliveredAt: registrations.deliveredAt,
          registeredAt: registrations.registeredAt,
        })
        .from(registrations)
        .innerJoin(qrCodeSets, eq(registrations.qrCodeSetId, qrCodeSets.id))
        .where(and(...whereConditions))
        .orderBy(sortOrder)
        .limit(pagination.limit)
        .offset(offset);

      // Transform to our beautiful interface format! ✨
      const transformedResults: RegistrationData[] = results.map(row => ({
        id: row.id,
        qrCodeSetId: row.qrCodeSetId,
        qrCodeId: row.qrCodeId,
        registrationData: row.registrationData,
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        referrer: row.referrer || undefined,
        deliveryStatus: row.deliveryStatus as 'pending' | 'delivered' | 'failed',
        deliveredAt: row.deliveredAt || undefined,
        registeredAt: row.registeredAt,
      }));

      return {
        registrations: transformedResults,
        totalCount,
        currentPage: pagination.page,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      };

    } catch (error) {
      console.error('❌ Error fetching registrations:', error);
      throw new Error(`Failed to fetch registrations: ${error.message}`);
    }
  }

  /**
   * Get a single registration by ID - Finding needles in haystacks! 🔍
   */
  async getRegistrationById(id: string): Promise<RegistrationData | null> {
    try {
      const [result] = await this.getDb()
        .select({
          id: registrations.id,
          qrCodeSetId: registrations.qrCodeSetId,
          qrCodeId: registrations.qrCodeId,
          registrationData: registrations.registrationData,
          ipAddress: registrations.ipAddress,
          userAgent: registrations.userAgent,
          referrer: registrations.referrer,
          deliveryStatus: registrations.deliveryStatus,
          deliveredAt: registrations.deliveredAt,
          registeredAt: registrations.registeredAt,
        })
        .from(registrations)
        .where(eq(registrations.id, id));

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        qrCodeSetId: result.qrCodeSetId,
        qrCodeId: result.qrCodeId,
        registrationData: result.registrationData,
        ipAddress: result.ipAddress || undefined,
        userAgent: result.userAgent || undefined,
        referrer: result.referrer || undefined,
        deliveryStatus: result.deliveryStatus as 'pending' | 'delivered' | 'failed',
        deliveredAt: result.deliveredAt || undefined,
        registeredAt: result.registeredAt,
      };

    } catch (error) {
      console.error('❌ Error fetching registration by ID:', error);
      throw new Error(`Failed to fetch registration: ${error.message}`);
    }
  }

  /**
   * Update delivery status - Status updates galore! 📦
   */
  async updateDeliveryStatus(
    id: string,
    status: 'pending' | 'delivered' | 'failed'
  ): Promise<RegistrationData | null> {
    try {
      const updateData: any = {
        deliveryStatus: status,
      };

      // Set deliveredAt timestamp when status is delivered
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (status === 'pending' || status === 'failed') {
        updateData.deliveredAt = null;
      }

      // SQLite-compatible update - TURSO EXCELLENCE! 🌟
      await this.getDb()
        .update(registrations)
        .set(updateData)
        .where(eq(registrations.id, id));

      // Get the updated registration - PERFECT! 🎯
      const [updated] = await this.getDb()
        .select({
          id: registrations.id,
          qrCodeSetId: registrations.qrCodeSetId,
          qrCodeId: registrations.qrCodeId,
          registrationData: registrations.registrationData,
          ipAddress: registrations.ipAddress,
          userAgent: registrations.userAgent,
          referrer: registrations.referrer,
          deliveryStatus: registrations.deliveryStatus,
          deliveredAt: registrations.deliveredAt,
          registeredAt: registrations.registeredAt,
        })
        .from(registrations)
        .where(eq(registrations.id, id));

      if (!updated) {
        return null;
      }

      return {
        id: updated.id,
        qrCodeSetId: updated.qrCodeSetId,
        qrCodeId: updated.qrCodeId,
        registrationData: updated.registrationData,
        ipAddress: updated.ipAddress || undefined,
        userAgent: updated.userAgent || undefined,
        referrer: updated.referrer || undefined,
        deliveryStatus: updated.deliveryStatus as 'pending' | 'delivered' | 'failed',
        deliveredAt: updated.deliveredAt || undefined,
        registeredAt: updated.registeredAt,
      };

    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  }

  /**
   * Get registration count by QR code - Counting made fun! 🔢
   */
  async getRegistrationCountByQRCode(qrCodeId: string): Promise<number> {
    try {
      const [result] = await this.getDb()
        .select({ count: count() })
        .from(registrations)
        .where(eq(registrations.qrCodeId, qrCodeId));

      return result.count;

    } catch (error) {
      console.error('❌ Error counting registrations by QR code:', error);
      throw new Error(`Failed to count registrations: ${error.message}`);
    }
  }

  /**
   * Bulk update delivery status - Bulk operations rock! 💪
   */
  async bulkUpdateDeliveryStatus(
    ids: string[],
    status: 'pending' | 'delivered' | 'failed'
  ): Promise<number> {
    try {
      if (ids.length === 0) {
        return 0;
      }

      const updateData: any = {
        deliveryStatus: status,
      };

      // Set deliveredAt timestamp when status is delivered
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (status === 'pending' || status === 'failed') {
        updateData.deliveredAt = null;
      }

      const result = await this.getDb()
        .update(registrations)
        .set(updateData)
        .where(inArray(registrations.id, ids));

      // Return the number of affected rows
      return result.rowCount || 0;

    } catch (error) {
      console.error('❌ Error bulk updating delivery status:', error);
      throw new Error(`Failed to bulk update delivery status: ${error.message}`);
    }
  }
}