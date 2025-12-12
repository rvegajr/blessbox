import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationService } from './OrganizationService';
import { getDbClient } from '../db';

vi.mock('../db', () => ({
  getDbClient: vi.fn(),
}));

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockDb: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = { execute: vi.fn() };
    (getDbClient as any).mockReturnValue(mockDb);
    service = new OrganizationService();
  });

  it('createOrganization creates organization with valid data', async () => {
    mockDb.execute
      .mockResolvedValueOnce({ rows: [] }) // checkEmailUniqueness
      .mockResolvedValueOnce({ rows: [] }) // insert
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'org-123',
            name: 'Test Organization',
            event_name: 'Test Event',
            custom_domain: null,
            contact_email: 'test@example.com',
            contact_phone: '555-1234',
            contact_address: '123 Main St',
            contact_city: 'Anytown',
            contact_state: 'CA',
            contact_zip: '12345',
            email_verified: 0,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
      }); // select by id

    const org = await service.createOrganization({
      name: 'Test Organization',
      eventName: 'Test Event',
      contactEmail: 'test@example.com',
      contactPhone: '555-1234',
      contactAddress: '123 Main St',
      contactCity: 'Anytown',
      contactState: 'CA',
      contactZip: '12345',
    });

    expect(org.id).toBe('org-123');
    expect(org.name).toBe('Test Organization');
    expect(org.contactEmail).toBe('test@example.com');
    expect(org.emailVerified).toBe(false);
  });

  it('createOrganization throws error for duplicate email', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [{ id: 'existing-org' }] });

    await expect(
      service.createOrganization({ name: 'Test Org', contactEmail: 'existing@example.com' })
    ).rejects.toThrow('Organization with this email already exists');
  });

  it('getOrganization returns organization for valid ID', async () => {
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'org-123',
          name: 'Test Organization',
          contact_email: 'test@example.com',
          email_verified: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const org = await service.getOrganization('org-123');
    expect(org?.id).toBe('org-123');
    expect(org?.emailVerified).toBe(true);
  });

  it('getOrganization returns null for invalid ID', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    await expect(service.getOrganization('missing')).resolves.toBeNull();
  });

  it('getOrganizationByEmail returns organization for valid email', async () => {
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          id: 'org-123',
          name: 'Test Organization',
          contact_email: 'test@example.com',
          email_verified: 0,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const org = await service.getOrganizationByEmail('test@example.com');
    expect(org?.contactEmail).toBe('test@example.com');
  });

  it('updateOrganization updates and returns updated record', async () => {
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'org-123',
            name: 'Old Name',
            contact_email: 'test@example.com',
            email_verified: 0,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
      }) // getOrganization(existing)
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'org-123',
            name: 'New Name',
            contact_email: 'test@example.com',
            email_verified: 0,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          },
        ],
      }); // getOrganization(updated)

    const updated = await service.updateOrganization('org-123', { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });

  it('verifyEmail returns error object for missing org', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    const res = await service.verifyEmail('missing');
    expect(res.success).toBe(false);
    expect(res.message).toContain('not found');
  });

  it('checkEmailUniqueness returns true when unique', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    await expect(service.checkEmailUniqueness('unique@example.com')).resolves.toBe(true);
  });

  it('checkEmailUniqueness returns false when exists', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [{ id: 'x' }] });
    await expect(service.checkEmailUniqueness('existing@example.com')).resolves.toBe(false);
  });
});
