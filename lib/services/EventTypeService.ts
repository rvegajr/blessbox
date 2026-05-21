/**
 * EventTypeService — pure logic, no DB.
 * Returns event-type enum values and starter form templates.
 */

import type {
  EventType,
  EventTypeTemplate,
  IEventTypeService,
} from '../interfaces/IEventTypeService';
import type { FormField } from '../interfaces/IFormConfigService';

const EVENT_TYPES: readonly EventType[] = [
  'food_distribution',
  'seminar',
  'volunteer',
  'custom',
] as const;

function nameField(order: number): FormField {
  return {
    id: 'full_name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Jane Doe',
    required: true,
    order,
  };
}

function emailField(order: number, required = true): FormField {
  return {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'jane@example.com',
    required,
    order,
  };
}

function phoneField(order: number, required = false): FormField {
  return {
    id: 'phone',
    type: 'phone',
    label: 'Phone Number',
    placeholder: '(555) 123-4567',
    required,
    order,
  };
}

function roleField(order: number, options: string[]): FormField {
  return {
    id: 'role',
    type: 'select',
    label: 'Your Role',
    placeholder: 'Select your role',
    required: false,
    order,
    options,
  };
}

const FOOD_DISTRIBUTION_ROLES = ['recipient', 'volunteer', 'staff'];
const SEMINAR_ROLES = ['attendee', 'speaker', 'organizer'];
const VOLUNTEER_ROLES = ['volunteer', 'coordinator'];

const TEMPLATES: Record<EventType, EventTypeTemplate> = {
  food_distribution: {
    eventType: 'food_distribution',
    defaultName: 'Food Distribution',
    formFields: [
      nameField(0),
      phoneField(1, true),
      {
        id: 'family_size',
        type: 'number',
        label: 'Family Size',
        placeholder: 'Number of people in household',
        required: true,
        order: 2,
        validation: { min: 1, max: 30 },
      },
      roleField(3, FOOD_DISTRIBUTION_ROLES),
    ],
    suggestedRoles: FOOD_DISTRIBUTION_ROLES,
  },
  seminar: {
    eventType: 'seminar',
    defaultName: 'Seminar Registration',
    formFields: [
      nameField(0),
      emailField(1, true),
      phoneField(2, false),
      roleField(3, SEMINAR_ROLES),
    ],
    suggestedRoles: SEMINAR_ROLES,
  },
  volunteer: {
    eventType: 'volunteer',
    defaultName: 'Volunteer Sign-up',
    formFields: [
      nameField(0),
      emailField(1, true),
      phoneField(2, true),
      roleField(3, VOLUNTEER_ROLES),
    ],
    suggestedRoles: VOLUNTEER_ROLES,
  },
  custom: {
    eventType: 'custom',
    defaultName: 'Custom Event',
    formFields: [
      nameField(0),
      emailField(1, true),
    ],
    suggestedRoles: [],
  },
};

export class EventTypeService implements IEventTypeService {
  listEventTypes(): EventType[] {
    return [...EVENT_TYPES];
  }

  isValidEventType(value: unknown): value is EventType {
    return typeof value === 'string' && (EVENT_TYPES as readonly string[]).includes(value);
  }

  getTemplate(eventType: EventType): EventTypeTemplate {
    if (!this.isValidEventType(eventType)) {
      throw new Error(`Unknown event type: ${String(eventType)}`);
    }
    const tpl = TEMPLATES[eventType];
    return {
      ...tpl,
      formFields: tpl.formFields.map((f) => ({ ...f })),
      suggestedRoles: [...tpl.suggestedRoles],
    };
  }

  getDefaultEventType(): EventType {
    return 'custom';
  }
}
