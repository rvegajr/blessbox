/**
 * IEventTypeService - Interface Segregation Principle Compliant.
 * Single responsibility: return event-type enum values and starter form templates.
 * Read-only by design; templates are static code.
 */

import type { FormField } from './IFormConfigService';

export type EventType =
  | 'food_distribution'
  | 'seminar'
  | 'volunteer'
  | 'custom';

export interface EventTypeTemplate {
  eventType: EventType;
  defaultName: string;
  formFields: FormField[];
  /** Conventional role values offered by check-in screens (may be empty). */
  suggestedRoles: string[];
}

export interface IEventTypeReader {
  listEventTypes(): EventType[];
  isValidEventType(value: unknown): value is EventType;
  getTemplate(eventType: EventType): EventTypeTemplate;
  getDefaultEventType(): EventType;
}

export type IEventTypeService = IEventTypeReader;
