/**
 * IEventService - Interface Segregation Principle Compliant.
 * Single responsibility: manage multi-event abstraction over qr_code_sets.
 * 
 * An "Event" is a high-level concept that wraps:
 * - A QR code set (from qr_code_sets table)
 * - A form config (stored with the QR code set)
 * - Registration counts aggregated from all QR codes in the set
 */

import type { EventType } from './IEventTypeService';
import type { FormField } from './IFormConfigService';
import type { QRCode } from './IQRCodeService';

export interface Event {
  id: string;
  organizationId: string;
  /** Form / registration form name (from qr_code_sets.name). Was historically
   *  exposed to the UI as the "event name", which is wrong — see Issue #24. */
  name: string;
  /** Real organization-level event name (from organizations.event_name).
   *  Falls back to `name` when the org didn't supply one. */
  eventName: string;
  eventType: EventType | null;
  description: string | null;
  formConfigId: string;
  qrCodes: QRCode[];
  registrationCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreate {
  organizationId: string;
  name: string;
  eventType: EventType;
  description?: string;
  formFields?: FormField[]; // Optional — falls back to template
}

export interface EventUpdate {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface IEventReader {
  listEvents(organizationId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | null>;
  countEvents(organizationId: string): Promise<number>;
}

export interface IEventWriter {
  createEvent(data: EventCreate): Promise<Event>;
  updateEvent(id: string, updates: EventUpdate): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
}

export type IEventService = IEventReader & IEventWriter;
