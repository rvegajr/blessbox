// IEnrollmentService Interface Tests - ISP compliance + capacity/duplicate behavior
// Issue: #30 - capacity limits and duplicate enrollment edge cases

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  IEnrollmentService,
  IEnrollmentReader,
  IEnrollmentWriter,
  EnrollmentRecord,
  EnrollmentCreateInput,
  EnrollmentResult,
} from './IEnrollmentService';

class MockEnrollmentService implements IEnrollmentService {
  private store = new Map<string, EnrollmentRecord>();
  private idCounter = 0;

  async enrollWithCapacity(
    input: EnrollmentCreateInput,
    capacity: number | null
  ): Promise<EnrollmentResult> {
    if (!input.participant_id || !input.class_id) {
      return { success: false, error: 'invalid_input', message: 'participant_id and class_id required' };
    }

    const existing = await this.getEnrollmentByParticipant(input.class_id, input.participant_id);
    if (existing && existing.enrollment_status !== 'cancelled') {
      return { success: false, error: 'already_enrolled', message: 'Participant already enrolled' };
    }

    if (capacity !== null) {
      const active = await this.countActiveEnrollments(input.class_id);
      if (active >= capacity) {
        return { success: false, error: 'capacity_reached', message: 'Class is at capacity' };
      }
    }

    const id = `enr_${++this.idCounter}`;
    const now = new Date().toISOString();
    const record: EnrollmentRecord = {
      id,
      participant_id: input.participant_id,
      class_id: input.class_id,
      session_id: input.session_id,
      enrollment_status: input.enrollment_status,
      enrolled_at: input.enrolled_at,
      notes: input.notes,
      created_at: now,
      updated_at: now,
    };
    this.store.set(id, record);
    return { success: true, enrollment: record };
  }

  async getEnrollment(id: string): Promise<EnrollmentRecord | null> {
    return this.store.get(id) ?? null;
  }

  async getEnrollmentByParticipant(
    classId: string,
    participantId: string
  ): Promise<EnrollmentRecord | null> {
    return (
      Array.from(this.store.values()).find(
        (e) => e.class_id === classId && e.participant_id === participantId
      ) ?? null
    );
  }

  async getEnrollmentsByClass(classId: string): Promise<EnrollmentRecord[]> {
    return Array.from(this.store.values()).filter((e) => e.class_id === classId);
  }

  async countActiveEnrollments(classId: string): Promise<number> {
    return Array.from(this.store.values()).filter(
      (e) => e.class_id === classId && e.enrollment_status !== 'cancelled'
    ).length;
  }

  async updateEnrollmentStatus(
    id: string,
    status: EnrollmentRecord['enrollment_status']
  ): Promise<EnrollmentRecord> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('Enrollment not found');
    const updated: EnrollmentRecord = {
      ...existing,
      enrollment_status: status,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : existing.confirmed_at,
      attended_at: status === 'attended' ? new Date().toISOString() : existing.attended_at,
      updated_at: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async deleteEnrollment(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error('Enrollment not found');
    this.store.delete(id);
  }
}

describe('IEnrollmentService Interface (ISP)', () => {
  let service: IEnrollmentService;

  const baseInput = (overrides: Partial<EnrollmentCreateInput> = {}): EnrollmentCreateInput => ({
    participant_id: 'p_1',
    class_id: 'c_1',
    enrollment_status: 'pending',
    enrolled_at: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    service = new MockEnrollmentService();
  });

  describe('Interface Segregation', () => {
    it('reader interface exposes only query methods', () => {
      const reader: IEnrollmentReader = service;
      expect(typeof reader.getEnrollment).toBe('function');
      expect(typeof reader.getEnrollmentByParticipant).toBe('function');
      expect(typeof reader.getEnrollmentsByClass).toBe('function');
      expect(typeof reader.countActiveEnrollments).toBe('function');
    });

    it('writer interface exposes only mutation methods', () => {
      const writer: IEnrollmentWriter = service;
      expect(typeof writer.enrollWithCapacity).toBe('function');
      expect(typeof writer.updateEnrollmentStatus).toBe('function');
      expect(typeof writer.deleteEnrollment).toBe('function');
    });
  });

  describe('enrollWithCapacity', () => {
    it('enrolls when below capacity', async () => {
      const result = await service.enrollWithCapacity(baseInput(), 5);
      expect(result.success).toBe(true);
      expect(result.enrollment?.id).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('enrolls without capacity check when capacity is null', async () => {
      const result = await service.enrollWithCapacity(baseInput(), null);
      expect(result.success).toBe(true);
    });

    it('rejects when class is at capacity (Aracela edge case 1)', async () => {
      // Fill capacity = 2
      await service.enrollWithCapacity(baseInput({ participant_id: 'p_1' }), 2);
      await service.enrollWithCapacity(baseInput({ participant_id: 'p_2' }), 2);

      const result = await service.enrollWithCapacity(baseInput({ participant_id: 'p_3' }), 2);
      expect(result.success).toBe(false);
      expect(result.error).toBe('capacity_reached');
      expect(result.message).toMatch(/capacity/i);
    });

    it('rejects duplicate enrollment with structured error (Aracela edge case 2)', async () => {
      await service.enrollWithCapacity(baseInput({ participant_id: 'p_1' }), 10);

      const dup = await service.enrollWithCapacity(baseInput({ participant_id: 'p_1' }), 10);
      expect(dup.success).toBe(false);
      expect(dup.error).toBe('already_enrolled');
    });

    it('rejects with invalid_input when missing required fields', async () => {
      const result = await service.enrollWithCapacity(
        baseInput({ participant_id: '' as any }),
        10
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_input');
    });
  });

  describe('deleteEnrollment (matches existing ClassService.deleteEnrollment)', () => {
    it('removes an enrollment by id', async () => {
      const enrolled = await service.enrollWithCapacity(baseInput(), 10);
      await service.deleteEnrollment(enrolled.enrollment!.id);
      const after = await service.getEnrollment(enrolled.enrollment!.id);
      expect(after).toBeNull();
    });

    it('throws when deleting non-existent enrollment', async () => {
      await expect(service.deleteEnrollment('nope')).rejects.toThrow('Enrollment not found');
    });
  });

  describe('countActiveEnrollments', () => {
    it('does not count cancelled enrollments', async () => {
      const a = await service.enrollWithCapacity(baseInput({ participant_id: 'p_1' }), 10);
      await service.enrollWithCapacity(baseInput({ participant_id: 'p_2' }), 10);
      await service.updateEnrollmentStatus(a.enrollment!.id, 'cancelled');

      expect(await service.countActiveEnrollments('c_1')).toBe(1);
    });
  });
});
