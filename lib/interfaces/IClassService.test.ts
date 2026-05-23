// IClassService Interface Tests - ISP compliance + behavior contract
// Issue: #30 - Classes and participant enrollment management

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  IClassService,
  IClassReader,
  IClassWriter,
  ClassRecord,
  ClassCreateInput,
  ClassUpdateInput,
} from './IClassService';

class MockClassService implements IClassService {
  private store = new Map<string, ClassRecord>();
  private enrollmentCounts = new Map<string, number>();

  async createClass(data: ClassCreateInput): Promise<ClassRecord> {
    const id = `cls_${this.store.size + 1}`;
    const now = new Date().toISOString();
    const record: ClassRecord = {
      id,
      organization_id: data.organization_id,
      name: data.name,
      description: data.description,
      capacity: data.capacity,
      timezone: data.timezone,
      status: data.status,
      created_at: now,
      updated_at: now,
    };
    this.store.set(id, record);
    return record;
  }

  async getClass(id: string): Promise<ClassRecord | null> {
    return this.store.get(id) ?? null;
  }

  async getClassesByOrganization(organizationId: string): Promise<ClassRecord[]> {
    return Array.from(this.store.values()).filter((c) => c.organization_id === organizationId);
  }

  async updateClass(id: string, updates: ClassUpdateInput): Promise<ClassRecord> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('Class not found');
    const updated: ClassRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async deleteClass(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error('Class not found');
    this.store.delete(id);
  }

  async countActiveEnrollments(classId: string): Promise<number> {
    return this.enrollmentCounts.get(classId) ?? 0;
  }

  // Test helper
  setEnrollmentCount(classId: string, count: number) {
    this.enrollmentCounts.set(classId, count);
  }
}

describe('IClassService Interface (ISP)', () => {
  let service: IClassService;

  beforeEach(() => {
    service = new MockClassService();
  });

  describe('Interface Segregation', () => {
    it('exposes only read methods through IClassReader', () => {
      const reader: IClassReader = service;
      expect(typeof reader.getClass).toBe('function');
      expect(typeof reader.getClassesByOrganization).toBe('function');
      expect(typeof reader.countActiveEnrollments).toBe('function');
    });

    it('exposes only write methods through IClassWriter', () => {
      const writer: IClassWriter = service;
      expect(typeof writer.createClass).toBe('function');
      expect(typeof writer.updateClass).toBe('function');
      expect(typeof writer.deleteClass).toBe('function');
    });

    it('combined IClassService extends both reader and writer', () => {
      expect(typeof service.getClass).toBe('function');
      expect(typeof service.createClass).toBe('function');
      expect(typeof service.updateClass).toBe('function');
      expect(typeof service.deleteClass).toBe('function');
    });
  });

  describe('createClass', () => {
    it('creates a class with required fields', async () => {
      const created = await service.createClass({
        organization_id: 'org_1',
        name: 'Yoga 101',
        description: 'Beginner yoga',
        capacity: 20,
        timezone: 'America/Los_Angeles',
        status: 'active',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Yoga 101');
      expect(created.capacity).toBe(20);
      expect(created.status).toBe('active');
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });
  });

  describe('updateClass (Aracela #3 - edit class info)', () => {
    it('updates class name and description', async () => {
      const cls = await service.createClass({
        organization_id: 'org_1',
        name: 'Original',
        capacity: 10,
        timezone: 'UTC',
        status: 'active',
      });

      const updated = await service.updateClass(cls.id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
      expect(updated.id).toBe(cls.id);
    });

    it('throws when updating non-existent class', async () => {
      await expect(service.updateClass('does-not-exist', { name: 'X' })).rejects.toThrow(
        'Class not found'
      );
    });
  });

  describe('deleteClass', () => {
    it('removes the class', async () => {
      const cls = await service.createClass({
        organization_id: 'org_1',
        name: 'Temp',
        capacity: 5,
        timezone: 'UTC',
        status: 'active',
      });

      await service.deleteClass(cls.id);
      expect(await service.getClass(cls.id)).toBeNull();
    });

    it('throws when deleting non-existent class', async () => {
      await expect(service.deleteClass('does-not-exist')).rejects.toThrow('Class not found');
    });
  });

  describe('getClassesByOrganization', () => {
    it('returns only classes for the given org', async () => {
      await service.createClass({
        organization_id: 'org_a',
        name: 'A1',
        capacity: 10,
        timezone: 'UTC',
        status: 'active',
      });
      await service.createClass({
        organization_id: 'org_b',
        name: 'B1',
        capacity: 10,
        timezone: 'UTC',
        status: 'active',
      });

      const aList = await service.getClassesByOrganization('org_a');
      expect(aList).toHaveLength(1);
      expect(aList[0].name).toBe('A1');
    });
  });

  describe('countActiveEnrollments', () => {
    it('returns the active enrollment count for capacity checks', async () => {
      const mock = service as MockClassService;
      mock.setEnrollmentCount('cls_x', 7);
      expect(await service.countActiveEnrollments('cls_x')).toBe(7);
    });

    it('returns 0 for class with no enrollments', async () => {
      expect(await service.countActiveEnrollments('cls_none')).toBe(0);
    });
  });
});
