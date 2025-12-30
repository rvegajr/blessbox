/**
 * MembershipService Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MembershipService } from './MembershipService';
import { getDbClient } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  getDbClient: vi.fn(),
}));

describe('MembershipService', () => {
  let service: MembershipService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
    };
    vi.mocked(getDbClient).mockReturnValue(mockDb);
    service = new MembershipService();
  });

  describe('ensureMembership', () => {
    it('creates membership idempotently', async () => {
      mockDb.execute.mockResolvedValue({ rows: [] });

      await service.ensureMembership('user-1', 'org-1', 'admin');

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO memberships'),
          args: expect.arrayContaining(['user-1', 'org-1', 'admin']),
        })
      );
    });

    it('uses default role "admin" if not provided', async () => {
      mockDb.execute.mockResolvedValue({ rows: [] });

      await service.ensureMembership('user-1', 'org-1');

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining(['admin']),
        })
      );
    });
  });

  describe('isMember', () => {
    it('returns true when membership exists', async () => {
      mockDb.execute.mockResolvedValue({ rows: [{ id: 'membership-1' }] });

      const result = await service.isMember('user-1', 'org-1');

      expect(result).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('SELECT id FROM memberships'),
          args: ['user-1', 'org-1'],
        })
      );
    });

    it('returns false when membership does not exist', async () => {
      mockDb.execute.mockResolvedValue({ rows: [] });

      const result = await service.isMember('user-1', 'org-1');

      expect(result).toBe(false);
    });
  });

  describe('listOrganizationsForUser', () => {
    it('returns organizations ordered by creation date DESC', async () => {
      mockDb.execute.mockResolvedValue({
        rows: [
          { id: 'org-2' },
          { id: 'org-1' },
        ],
      });

      const result = await service.listOrganizationsForUser('user-1');

      expect(result).toEqual([{ id: 'org-2' }, { id: 'org-1' }]);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('ORDER BY created_at DESC'),
          args: ['user-1'],
        })
      );
    });

    it('returns empty array when user has no memberships', async () => {
      mockDb.execute.mockResolvedValue({ rows: [] });

      const result = await service.listOrganizationsForUser('user-1');

      expect(result).toEqual([]);
    });
  });
});


