// IParticipantService Interface Tests - ISP compliance + behavior contract
// Issue: #30 - participant edit/delete actions (Aracela's note #2)

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  IParticipantService,
  IParticipantReader,
  IParticipantWriter,
  ParticipantRecord,
  ParticipantCreateInput,
  ParticipantUpdateInput,
} from './IParticipantService';

class MockParticipantService implements IParticipantService {
  private store = new Map<string, ParticipantRecord>();

  async createParticipant(data: ParticipantCreateInput): Promise<ParticipantRecord> {
    const id = `p_${this.store.size + 1}`;
    const now = new Date().toISOString();
    const record: ParticipantRecord = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };
    this.store.set(id, record);
    return record;
  }

  async getParticipant(id: string): Promise<ParticipantRecord | null> {
    return this.store.get(id) ?? null;
  }

  async getParticipantsByOrganization(organizationId: string): Promise<ParticipantRecord[]> {
    return Array.from(this.store.values()).filter((p) => p.organization_id === organizationId);
  }

  async findParticipantByEmail(
    organizationId: string,
    email: string
  ): Promise<ParticipantRecord | null> {
    return (
      Array.from(this.store.values()).find(
        (p) => p.organization_id === organizationId && p.email.toLowerCase() === email.toLowerCase()
      ) ?? null
    );
  }

  async updateParticipant(id: string, updates: ParticipantUpdateInput): Promise<ParticipantRecord> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('Participant not found');
    const updated: ParticipantRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async deleteParticipant(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error('Participant not found');
    this.store.delete(id);
  }
}

describe('IParticipantService Interface (ISP)', () => {
  let service: IParticipantService;

  beforeEach(() => {
    service = new MockParticipantService();
  });

  describe('Interface Segregation', () => {
    it('reader interface exposes only query methods', () => {
      const reader: IParticipantReader = service;
      expect(typeof reader.getParticipant).toBe('function');
      expect(typeof reader.getParticipantsByOrganization).toBe('function');
      expect(typeof reader.findParticipantByEmail).toBe('function');
    });

    it('writer interface exposes only mutation methods', () => {
      const writer: IParticipantWriter = service;
      expect(typeof writer.createParticipant).toBe('function');
      expect(typeof writer.updateParticipant).toBe('function');
      expect(typeof writer.deleteParticipant).toBe('function');
    });
  });

  describe('createParticipant', () => {
    it('creates a participant with all fields', async () => {
      const p = await service.createParticipant({
        organization_id: 'org_1',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '555-0100',
        status: 'active',
      });

      expect(p.id).toBeDefined();
      expect(p.first_name).toBe('Jane');
      expect(p.email).toBe('jane@example.com');
      expect(p.status).toBe('active');
    });
  });

  describe('updateParticipant (Aracela #2 - edit action)', () => {
    it('updates participant info', async () => {
      const p = await service.createParticipant({
        organization_id: 'org_1',
        first_name: 'Old',
        last_name: 'Name',
        email: 'old@example.com',
        status: 'active',
      });

      const updated = await service.updateParticipant(p.id, {
        first_name: 'New',
        email: 'new@example.com',
      });

      expect(updated.first_name).toBe('New');
      expect(updated.last_name).toBe('Name');
      expect(updated.email).toBe('new@example.com');
    });

    it('throws on missing participant', async () => {
      await expect(service.updateParticipant('nope', { first_name: 'X' })).rejects.toThrow(
        'Participant not found'
      );
    });
  });

  describe('deleteParticipant (Aracela #2 - delete action)', () => {
    it('removes the participant', async () => {
      const p = await service.createParticipant({
        organization_id: 'org_1',
        first_name: 'Temp',
        last_name: 'Person',
        email: 'temp@example.com',
        status: 'active',
      });

      await service.deleteParticipant(p.id);
      expect(await service.getParticipant(p.id)).toBeNull();
    });

    it('throws on missing participant', async () => {
      await expect(service.deleteParticipant('nope')).rejects.toThrow('Participant not found');
    });
  });

  describe('findParticipantByEmail (duplicate prevention)', () => {
    it('finds participants case-insensitively', async () => {
      await service.createParticipant({
        organization_id: 'org_1',
        first_name: 'Sam',
        last_name: 'Smith',
        email: 'Sam.Smith@example.com',
        status: 'active',
      });

      const found = await service.findParticipantByEmail('org_1', 'sam.smith@example.com');
      expect(found).not.toBeNull();
      expect(found?.first_name).toBe('Sam');
    });

    it('returns null when not found', async () => {
      const found = await service.findParticipantByEmail('org_1', 'no-one@example.com');
      expect(found).toBeNull();
    });

    it('scopes lookup to organization', async () => {
      await service.createParticipant({
        organization_id: 'org_a',
        first_name: 'A',
        last_name: 'A',
        email: 'shared@example.com',
        status: 'active',
      });
      const found = await service.findParticipantByEmail('org_b', 'shared@example.com');
      expect(found).toBeNull();
    });
  });
});
