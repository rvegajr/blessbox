import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventService } from './EventService';
import type { IQRCodeService } from '../interfaces/IQRCodeService';
import type { IFormConfigService } from '../interfaces/IFormConfigService';
import type { IEventTypeService } from '../interfaces/IEventTypeService';

describe('EventService', () => {
  let eventService: EventService;
  let mockQRCodeService: IQRCodeService;
  let mockFormConfigService: IFormConfigService;
  let mockEventTypeService: IEventTypeService;

  beforeEach(() => {
    // Mock QRCodeService
    mockQRCodeService = {
      getQRCodeSets: vi.fn(),
      getQRCodeSet: vi.fn(),
      updateQRCodeSet: vi.fn(),
      getQRCodesBySet: vi.fn(),
      listQRCodes: vi.fn(),
      getQRCode: vi.fn(),
      updateQRCode: vi.fn(),
      deleteQRCode: vi.fn(),
      downloadQRCode: vi.fn(),
      getQRCodeAnalytics: vi.fn(),
    } as any;

    // Mock FormConfigService
    mockFormConfigService = {
      createFormConfig: vi.fn(),
      getFormConfig: vi.fn(),
      getFormConfigByOrganization: vi.fn(),
      updateFormConfig: vi.fn(),
      deleteFormConfig: vi.fn(),
      validateFormConfig: vi.fn(),
      validateFormFields: vi.fn(),
    } as any;

    // Mock EventTypeService
    mockEventTypeService = {
      listEventTypes: vi.fn(),
      isValidEventType: vi.fn(),
      getTemplate: vi.fn(),
      getDefaultEventType: vi.fn(),
    } as any;

    eventService = new EventService(
      mockQRCodeService,
      mockFormConfigService,
      mockEventTypeService
    );
  });

  describe('listEvents', () => {
    it('returns all events for an organization', async () => {
      const mockQRCodeSets = [
        {
          id: 'qr-set-1',
          organizationId: 'org-1',
          name: 'Sunday Food Distribution',
          language: 'en',
          isActive: true,
          scanCount: 50,
          eventType: 'food_distribution',
          description: 'Weekly food distribution event',
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-01T00:00:00Z',
        },
        {
          id: 'qr-set-2',
          organizationId: 'org-1',
          name: 'Q3 Leadership Seminar',
          language: 'en',
          isActive: true,
          scanCount: 20,
          eventType: 'seminar',
          description: null,
          createdAt: '2026-05-10T00:00:00Z',
          updatedAt: '2026-05-10T00:00:00Z',
        },
      ];

      const mockQRCodes1 = [
        { id: 'qr-1', qrCodeSetId: 'qr-set-1', label: 'Main', registrationCount: 30 },
        { id: 'qr-2', qrCodeSetId: 'qr-set-1', label: 'Side', registrationCount: 20 },
      ];

      const mockQRCodes2 = [
        { id: 'qr-3', qrCodeSetId: 'qr-set-2', label: 'Entrance', registrationCount: 15 },
      ];

      vi.mocked(mockQRCodeService.getQRCodeSets).mockResolvedValue(mockQRCodeSets);
      vi.mocked(mockQRCodeService.getQRCodesBySet)
        .mockResolvedValueOnce(mockQRCodes1 as any)
        .mockResolvedValueOnce(mockQRCodes2 as any);

      const events = await eventService.listEvents('org-1');

      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('qr-set-1');
      expect(events[0].name).toBe('Sunday Food Distribution');
      expect(events[0].eventType).toBe('food_distribution');
      expect(events[0].registrationCount).toBe(50); // 30 + 20
      expect(events[0].qrCodes).toHaveLength(2);
      expect(events[1].id).toBe('qr-set-2');
      expect(events[1].registrationCount).toBe(15);
      expect(mockQRCodeService.getQRCodeSets).toHaveBeenCalledWith('org-1');
    });

    it('returns empty array when organization has no events', async () => {
      vi.mocked(mockQRCodeService.getQRCodeSets).mockResolvedValue([]);

      const events = await eventService.listEvents('org-empty');

      expect(events).toEqual([]);
      expect(mockQRCodeService.getQRCodeSets).toHaveBeenCalledWith('org-empty');
    });
  });

  describe('getEvent', () => {
    it('returns a single event with its QR codes', async () => {
      const mockQRCodeSet = {
        id: 'qr-set-1',
        organizationId: 'org-1',
        name: 'Sunday Food Distribution',
        language: 'en',
        isActive: true,
        scanCount: 50,
        eventType: 'food_distribution',
        description: 'Weekly event',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      };

      const mockQRCodes = [
        { id: 'qr-1', qrCodeSetId: 'qr-set-1', registrationCount: 30 },
        { id: 'qr-2', qrCodeSetId: 'qr-set-1', registrationCount: 20 },
      ];

      vi.mocked(mockQRCodeService.getQRCodeSet).mockResolvedValue(mockQRCodeSet);
      vi.mocked(mockQRCodeService.getQRCodesBySet).mockResolvedValue(mockQRCodes as any);

      const event = await eventService.getEvent('qr-set-1');

      expect(event).not.toBeNull();
      expect(event?.id).toBe('qr-set-1');
      expect(event?.name).toBe('Sunday Food Distribution');
      expect(event?.eventType).toBe('food_distribution');
      expect(event?.registrationCount).toBe(50);
      expect(event?.qrCodes).toHaveLength(2);
      expect(mockQRCodeService.getQRCodeSet).toHaveBeenCalledWith('qr-set-1');
      expect(mockQRCodeService.getQRCodesBySet).toHaveBeenCalledWith('qr-set-1');
    });

    it('returns null when event does not exist', async () => {
      vi.mocked(mockQRCodeService.getQRCodeSet).mockResolvedValue(null);

      const event = await eventService.getEvent('nonexistent');

      expect(event).toBeNull();
      expect(mockQRCodeService.getQRCodeSet).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('countEvents', () => {
    it('counts all events for an organization', async () => {
      const mockQRCodeSets = [
        { id: 'qr-set-1', organizationId: 'org-1', isActive: true },
        { id: 'qr-set-2', organizationId: 'org-1', isActive: true },
        { id: 'qr-set-3', organizationId: 'org-1', isActive: false },
      ];

      vi.mocked(mockQRCodeService.getQRCodeSets).mockResolvedValue(mockQRCodeSets as any);

      const count = await eventService.countEvents('org-1');

      expect(count).toBe(3);
      expect(mockQRCodeService.getQRCodeSets).toHaveBeenCalledWith('org-1');
    });

    it('returns 0 when organization has no events', async () => {
      vi.mocked(mockQRCodeService.getQRCodeSets).mockResolvedValue([]);

      const count = await eventService.countEvents('org-empty');

      expect(count).toBe(0);
    });
  });

  describe('createEvent', () => {
    it('creates a new event with form config and QR codes from template', async () => {
      const mockTemplate = {
        eventType: 'food_distribution' as const,
        defaultName: 'Food Distribution',
        formFields: [
          { id: 'name', type: 'text' as const, label: 'Name', required: true, order: 0 },
          { id: 'email', type: 'email' as const, label: 'Email', required: true, order: 1 },
        ],
        suggestedRoles: ['recipient', 'volunteer'],
      };

      const mockFormConfig = {
        id: 'form-1',
        organizationId: 'org-1',
        name: 'Christmas Drive',
        language: 'en',
        formFields: mockTemplate.formFields,
        eventType: 'food_distribution',
        description: 'Holiday food distribution',
        createdAt: '2026-05-20T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      const mockQRCodeSet = {
        id: 'form-1', // FormConfigService creates QR code set with same ID
        organizationId: 'org-1',
        name: 'Christmas Drive',
        language: 'en',
        isActive: true,
        scanCount: 0,
        eventType: 'food_distribution',
        description: 'Holiday food distribution',
        createdAt: '2026-05-20T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      const mockQRCodes = [
        { id: 'qr-1', qrCodeSetId: 'form-1', label: 'Main', registrationCount: 0 },
      ];

      vi.mocked(mockEventTypeService.getTemplate).mockReturnValue(mockTemplate);
      vi.mocked(mockFormConfigService.createFormConfig).mockResolvedValue(mockFormConfig);
      vi.mocked(mockQRCodeService.getQRCodeSet).mockResolvedValue(mockQRCodeSet);
      vi.mocked(mockQRCodeService.getQRCodesBySet).mockResolvedValue(mockQRCodes as any);

      const event = await eventService.createEvent({
        organizationId: 'org-1',
        name: 'Christmas Drive',
        eventType: 'food_distribution',
        description: 'Holiday food distribution',
      });

      expect(event.id).toBe('form-1');
      expect(event.name).toBe('Christmas Drive');
      expect(event.eventType).toBe('food_distribution');
      expect(event.qrCodes.length).toBeGreaterThanOrEqual(1);
      expect(mockEventTypeService.getTemplate).toHaveBeenCalledWith('food_distribution');
      expect(mockFormConfigService.createFormConfig).toHaveBeenCalledWith({
        organizationId: 'org-1',
        name: 'Christmas Drive',
        language: 'en',
        formFields: mockTemplate.formFields,
        eventType: 'food_distribution',
        description: 'Holiday food distribution',
      });
    });

    it('creates event with custom form fields when provided', async () => {
      const customFields = [
        { id: 'custom', type: 'text' as const, label: 'Custom', required: false, order: 0 },
      ];

      const mockFormConfig = {
        id: 'form-2',
        organizationId: 'org-1',
        name: 'Custom Event',
        language: 'en',
        formFields: customFields,
        eventType: 'custom',
        description: null,
        createdAt: '2026-05-20T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      const mockQRCodeSet = {
        id: 'form-2',
        organizationId: 'org-1',
        name: 'Custom Event',
        language: 'en',
        isActive: true,
        scanCount: 0,
        eventType: 'custom',
        description: null,
        createdAt: '2026-05-20T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      const mockQRCodes = [
        { id: 'qr-2', qrCodeSetId: 'form-2', registrationCount: 0 },
      ];

      vi.mocked(mockFormConfigService.createFormConfig).mockResolvedValue(mockFormConfig);
      vi.mocked(mockQRCodeService.getQRCodeSet).mockResolvedValue(mockQRCodeSet);
      vi.mocked(mockQRCodeService.getQRCodesBySet).mockResolvedValue(mockQRCodes as any);

      const event = await eventService.createEvent({
        organizationId: 'org-1',
        name: 'Custom Event',
        eventType: 'custom',
        formFields: customFields,
      });

      expect(event.id).toBe('form-2');
      expect(mockEventTypeService.getTemplate).not.toHaveBeenCalled();
      expect(mockFormConfigService.createFormConfig).toHaveBeenCalledWith({
        organizationId: 'org-1',
        name: 'Custom Event',
        language: 'en',
        formFields: customFields,
        eventType: 'custom',
        description: undefined,
      });
    });

    it('throws when form config creation fails', async () => {
      const mockTemplate = {
        eventType: 'seminar' as const,
        defaultName: 'Seminar',
        formFields: [],
        suggestedRoles: [],
      };

      vi.mocked(mockEventTypeService.getTemplate).mockReturnValue(mockTemplate);
      vi.mocked(mockFormConfigService.createFormConfig).mockRejectedValue(
        new Error('Organization not found')
      );

      await expect(
        eventService.createEvent({
          organizationId: 'nonexistent',
          name: 'Failed Event',
          eventType: 'seminar',
        })
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('updateEvent', () => {
    it('updates event name and description', async () => {
      const mockUpdatedSet = {
        id: 'qr-set-1',
        organizationId: 'org-1',
        name: 'Updated Name',
        language: 'en',
        isActive: true,
        scanCount: 50,
        eventType: 'food_distribution',
        description: 'Updated description',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      const mockQRCodes = [
        { id: 'qr-1', qrCodeSetId: 'qr-set-1', registrationCount: 30 },
      ];

      vi.mocked(mockQRCodeService.updateQRCodeSet).mockResolvedValue(mockUpdatedSet);
      vi.mocked(mockQRCodeService.getQRCodesBySet).mockResolvedValue(mockQRCodes as any);

      const event = await eventService.updateEvent('qr-set-1', {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(event.id).toBe('qr-set-1');
      expect(event.name).toBe('Updated Name');
      expect(event.description).toBe('Updated description');
      expect(mockQRCodeService.updateQRCodeSet).toHaveBeenCalledWith('qr-set-1', {
        name: 'Updated Name',
        description: 'Updated description',
      });
    });

    it('soft-deletes event by setting isActive to false', async () => {
      const mockUpdatedSet = {
        id: 'qr-set-1',
        organizationId: 'org-1',
        name: 'Inactive Event',
        language: 'en',
        isActive: false,
        scanCount: 50,
        eventType: 'food_distribution',
        description: null,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      const mockQRCodes = [
        { id: 'qr-1', qrCodeSetId: 'qr-set-1', registrationCount: 30 },
      ];

      vi.mocked(mockQRCodeService.updateQRCodeSet).mockResolvedValue(mockUpdatedSet);
      vi.mocked(mockQRCodeService.getQRCodesBySet).mockResolvedValue(mockQRCodes as any);

      const event = await eventService.updateEvent('qr-set-1', {
        isActive: false,
      });

      expect(event.isActive).toBe(false);
      expect(mockQRCodeService.updateQRCodeSet).toHaveBeenCalledWith('qr-set-1', {
        isActive: false,
      });
    });
  });

  describe('deleteEvent', () => {
    it('soft-deletes event without affecting other events', async () => {
      const mockUpdatedSet = {
        id: 'qr-set-1',
        organizationId: 'org-1',
        name: 'Deleted Event',
        language: 'en',
        isActive: false,
        scanCount: 0,
        eventType: 'food_distribution',
        description: null,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      };

      vi.mocked(mockQRCodeService.updateQRCodeSet).mockResolvedValue(mockUpdatedSet);

      await eventService.deleteEvent('qr-set-1');

      expect(mockQRCodeService.updateQRCodeSet).toHaveBeenCalledWith('qr-set-1', {
        isActive: false,
      });
    });

    it('throws when trying to delete nonexistent event', async () => {
      vi.mocked(mockQRCodeService.updateQRCodeSet).mockRejectedValue(
        new Error('QR code set not found')
      );

      await expect(eventService.deleteEvent('nonexistent')).rejects.toThrow(
        'QR code set not found'
      );
    });
  });
});
