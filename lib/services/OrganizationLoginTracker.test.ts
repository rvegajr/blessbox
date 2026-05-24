/**
 * OrganizationLoginTracker Tests (TDD — Issue #28)
 *
 * Covers:
 *   - explicit org update (active-org cookie path)
 *   - membership fan-out (no org provided)
 *   - no-op on missing userId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = { execute: vi.fn() };

vi.mock('../db', () => ({
  getDbClient: () => mockDb,
  nowIso: () => '2026-05-24T03:00:00.000Z',
}));

import { OrganizationLoginTracker } from './OrganizationLoginTracker';

describe('OrganizationLoginTracker', () => {
  beforeEach(() => {
    mockDb.execute.mockReset();
  });

  it('returns early without DB writes when userId is empty', async () => {
    const tracker = new OrganizationLoginTracker();
    await tracker.recordLogin('');
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('updates exactly one org when organizationId is provided', async () => {
    mockDb.execute.mockResolvedValue({ rows: [] });
    const tracker = new OrganizationLoginTracker();
    await tracker.recordLogin('user-1', 'org-A');

    expect(mockDb.execute).toHaveBeenCalledTimes(1);
    const call = mockDb.execute.mock.calls[0][0];
    expect(call.sql).toMatch(/UPDATE organizations/i);
    expect(call.sql).toMatch(/last_login_at = \?/i);
    expect(call.args).toEqual(['2026-05-24T03:00:00.000Z', '2026-05-24T03:00:00.000Z', 'org-A']);
  });

  it('fans out to every membership when no organizationId is given', async () => {
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          { organization_id: 'org-1' },
          { organization_id: 'org-2' },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const tracker = new OrganizationLoginTracker();
    await tracker.recordLogin('user-1');

    expect(mockDb.execute).toHaveBeenCalledTimes(3);
    expect(mockDb.execute.mock.calls[0][0].sql).toMatch(/SELECT organization_id FROM memberships/i);
    expect(mockDb.execute.mock.calls[1][0].args).toEqual(['2026-05-24T03:00:00.000Z', '2026-05-24T03:00:00.000Z', 'org-1']);
    expect(mockDb.execute.mock.calls[2][0].args).toEqual(['2026-05-24T03:00:00.000Z', '2026-05-24T03:00:00.000Z', 'org-2']);
  });

  it('does no UPDATE when user has no memberships', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    const tracker = new OrganizationLoginTracker();
    await tracker.recordLogin('user-1');
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
    expect(mockDb.execute.mock.calls[0][0].sql).toMatch(/SELECT organization_id FROM memberships/i);
  });
});
