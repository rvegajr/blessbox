/**
 * EventTypeFormApplier — pure logic, no DOM, no DB.
 *
 * Implements IEventTypeFormApplier (see interface for behavior contract).
 * Drives the fix for Issue #17 retest:
 *   1. Switching event type live-updates form fields when pristine.
 *   2. The legacy "Registration Form" title is replaced with the
 *      template's defaultName so the dashboard event filter shows the
 *      real event name.
 */

import type { IEventTypeFormApplier } from '../interfaces/IEventTypeFormApplier';
import type { EventType, IEventTypeReader } from '../interfaces/IEventTypeService';
import type {
  FormBuilderData,
  FormField,
} from '../../components/OnboardingWizard.interface';

const LEGACY_TITLE = 'Registration Form';
const SUPPORTED_LOCAL_TYPES: ReadonlySet<string> = new Set([
  'text',
  'email',
  'phone',
  'select',
  'textarea',
  'checkbox',
]);

export class EventTypeFormApplier implements IEventTypeFormApplier {
  constructor(private readonly eventTypeService: IEventTypeReader) {}

  applyTemplate(
    current: FormBuilderData,
    prevEventType: EventType | null,
    nextEventType: EventType
  ): FormBuilderData {
    const tpl = this.eventTypeService.getTemplate(nextEventType);
    const templateFields = tpl.formFields.map(toLocalField);

    // Decide on fields. We replace when the user hasn't touched anything;
    // otherwise we preserve their work to avoid silently dropping changes.
    const nextFields: FormField[] = this.isPristine(current.fields, prevEventType)
      ? templateFields
      : current.fields.map((f) => ({ ...f }));

    // Decide on title. Replace when:
    //   - empty
    //   - legacy default ("Registration Form")
    //   - matches the previous template's defaultName (so the user clearly
    //     never typed their own name)
    const nextTitle = this.shouldReplaceTitle(current.title, prevEventType)
      ? tpl.defaultName
      : current.title;

    return {
      fields: nextFields,
      title: nextTitle,
      description: current.description,
    };
  }

  isPristine(fields: FormField[], prevEventType: EventType | null): boolean {
    if (fields.length === 0) return true;
    if (!prevEventType) return false;

    const prevTpl = this.eventTypeService.getTemplate(prevEventType);
    const expected = prevTpl.formFields.map(toLocalField);
    if (expected.length !== fields.length) return false;

    return expected.every((expectedField, idx) => {
      const actual = fields[idx];
      return (
        actual.id === expectedField.id &&
        actual.type === expectedField.type &&
        actual.label === expectedField.label &&
        !!actual.required === !!expectedField.required
      );
    });
  }

  private shouldReplaceTitle(title: string, prevEventType: EventType | null): boolean {
    const trimmed = (title ?? '').trim();
    if (trimmed.length === 0) return true;
    if (trimmed === LEGACY_TITLE) return true;
    if (prevEventType) {
      const prevTpl = this.eventTypeService.getTemplate(prevEventType);
      if (trimmed === prevTpl.defaultName) return true;
    }
    return false;
  }
}

/**
 * Coerce IFormConfigService.FormField → local OnboardingWizard.FormField.
 * The local type is narrower (no number/date), so non-supported types
 * fall back to text — the same behavior the page used inline before.
 */
function toLocalField(f: {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
}): FormField {
  return {
    id: f.id,
    type: (SUPPORTED_LOCAL_TYPES.has(f.type) ? f.type : 'text') as FormField['type'],
    label: f.label,
    placeholder: f.placeholder,
    required: f.required,
  };
}
