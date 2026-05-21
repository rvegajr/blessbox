import type {
  IEventService,
  Event,
  EventCreate,
  EventUpdate,
} from '../interfaces/IEventService';
import type { IQRCodeService } from '../interfaces/IQRCodeService';
import type { IFormConfigService } from '../interfaces/IFormConfigService';
import type { IEventTypeService } from '../interfaces/IEventTypeService';

/**
 * EventService - Composition layer over QRCodeService and FormConfigService.
 * 
 * Provides a high-level "Event" abstraction where each Event is backed by
 * a qr_code_set row. No new tables required.
 * 
 * Key responsibilities:
 * - List/get events (qr_code_sets) for an organization
 * - Create events (form config + QR code set)
 * - Update event metadata (name, description, isActive)
 * - Soft-delete events (set isActive=false)
 * - Aggregate registration counts across all QR codes in an event
 */
export class EventService implements IEventService {
  constructor(
    private qrCodeService: IQRCodeService,
    private formConfigService: IFormConfigService,
    private eventTypeService: IEventTypeService
  ) {}

  async listEvents(organizationId: string): Promise<Event[]> {
    const qrCodeSets = await this.qrCodeService.getQRCodeSets(organizationId);
    
    const events: Event[] = [];
    for (const qrCodeSet of qrCodeSets) {
      const qrCodes = await this.qrCodeService.getQRCodesBySet(qrCodeSet.id);
      
      // Aggregate registration counts from all QR codes
      const registrationCount = qrCodes.reduce(
        (sum, qr) => sum + qr.registrationCount,
        0
      );

      events.push({
        id: qrCodeSet.id,
        organizationId: qrCodeSet.organizationId,
        name: qrCodeSet.name,
        eventType: qrCodeSet.eventType as any,
        description: qrCodeSet.description ?? null,
        formConfigId: qrCodeSet.id, // Form config ID === QR code set ID
        qrCodes,
        registrationCount,
        isActive: qrCodeSet.isActive,
        createdAt: qrCodeSet.createdAt,
        updatedAt: qrCodeSet.updatedAt,
      });
    }

    return events;
  }

  async getEvent(id: string): Promise<Event | null> {
    const qrCodeSet = await this.qrCodeService.getQRCodeSet(id);
    if (!qrCodeSet) {
      return null;
    }

    const qrCodes = await this.qrCodeService.getQRCodesBySet(id);
    
    // Aggregate registration counts from all QR codes
    const registrationCount = qrCodes.reduce(
      (sum, qr) => sum + qr.registrationCount,
      0
    );

    return {
      id: qrCodeSet.id,
      organizationId: qrCodeSet.organizationId,
      name: qrCodeSet.name,
      eventType: qrCodeSet.eventType as any,
      description: qrCodeSet.description ?? null,
      formConfigId: qrCodeSet.id,
      qrCodes,
      registrationCount,
      isActive: qrCodeSet.isActive,
      createdAt: qrCodeSet.createdAt,
      updatedAt: qrCodeSet.updatedAt,
    };
  }

  async countEvents(organizationId: string): Promise<number> {
    const qrCodeSets = await this.qrCodeService.getQRCodeSets(organizationId);
    return qrCodeSets.length;
  }

  async createEvent(data: EventCreate): Promise<Event> {
    // Get form fields from template if not provided
    let formFields = data.formFields;
    if (!formFields) {
      const template = this.eventTypeService.getTemplate(data.eventType);
      formFields = template.formFields;
    }

    // Create form config (which creates the QR code set automatically)
    const formConfig = await this.formConfigService.createFormConfig({
      organizationId: data.organizationId,
      name: data.name,
      language: 'en',
      formFields,
      eventType: data.eventType,
      description: data.description,
    });

    // Retrieve the created QR code set and its QR codes
    const qrCodeSet = await this.qrCodeService.getQRCodeSet(formConfig.id);
    if (!qrCodeSet) {
      throw new Error('Failed to create QR code set');
    }

    const qrCodes = await this.qrCodeService.getQRCodesBySet(formConfig.id);

    return {
      id: qrCodeSet.id,
      organizationId: qrCodeSet.organizationId,
      name: qrCodeSet.name,
      eventType: qrCodeSet.eventType as any,
      description: qrCodeSet.description ?? null,
      formConfigId: formConfig.id,
      qrCodes,
      registrationCount: 0,
      isActive: qrCodeSet.isActive,
      createdAt: qrCodeSet.createdAt,
      updatedAt: qrCodeSet.updatedAt,
    };
  }

  async updateEvent(id: string, updates: EventUpdate): Promise<Event> {
    // Update the QR code set
    const updatedSet = await this.qrCodeService.updateQRCodeSet(id, {
      name: updates.name,
      description: updates.description,
      isActive: updates.isActive,
    });

    // Get QR codes for registration count
    const qrCodes = await this.qrCodeService.getQRCodesBySet(id);
    const registrationCount = qrCodes.reduce(
      (sum, qr) => sum + qr.registrationCount,
      0
    );

    return {
      id: updatedSet.id,
      organizationId: updatedSet.organizationId,
      name: updatedSet.name,
      eventType: updatedSet.eventType as any,
      description: updatedSet.description ?? null,
      formConfigId: updatedSet.id,
      qrCodes,
      registrationCount,
      isActive: updatedSet.isActive,
      createdAt: updatedSet.createdAt,
      updatedAt: updatedSet.updatedAt,
    };
  }

  async deleteEvent(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await this.qrCodeService.updateQRCodeSet(id, {
      isActive: false,
    });
  }
}
