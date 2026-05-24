/**
 * EventTypeFormApplier Tests — TDD RED-first.
 *
 * Drives Issue #17 (retest) fix: the page logic that decides what to do
 * with form fields and title when the user changes the event type.
 *
 * Pure logic, no DOM, no DB. The page will delegate to this service.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventTypeFormApplier } from './EventTypeFormApplier';
import { EventTypeService } from './EventTypeService';
import type { FormBuilderData, FormField } from '../../components/OnboardingWizard.interface';

describe('EventTypeFormApplier', () => {
  let applier: EventTypeFormApplier;
  const eventTypeService = new EventTypeService();

  beforeEach(() => {
    applier = new EventTypeFormApplier(eventTypeService);
  });

  const emptyForm: FormBuilderData = {
    fields: [],
    title: '',
    description: '',
  };

  describe('applyTemplate (Bug #1: reactivity)', () => {
    it('seeds fields from the template when the current form is empty', () => {
      const next = applier.applyTemplate(emptyForm, null, 'food_distribution');

      const food = eventTypeService.getTemplate('food_distribution');
      expect(next.fields.map((f) => f.id)).toEqual(food.formFields.map((f) => f.id));
      expect(next.title).toBe(food.defaultName);
    });

    it('REPLACES fields when switching from one template to another and fields are pristine', () => {
      // Start from the "food_distribution" template, untouched.
      const food = eventTypeService.getTemplate('food_distribution');
      const fromFood: FormBuilderData = {
        fields: food.formFields.map(toLocalField),
        title: food.defaultName,
        description: '',
      };

      const next = applier.applyTemplate(fromFood, 'food_distribution', 'seminar');
      const seminar = eventTypeService.getTemplate('seminar');

      expect(next.fields.map((f) => f.id)).toEqual(seminar.formFields.map((f) => f.id));
      expect(next.fields.find((f) => f.id === 'family_size')).toBeUndefined();
      expect(next.fields.find((f) => f.id === 'email')).toBeDefined();
    });

    it('PRESERVES fields when the user has customized them', () => {
      // User started from food template then renamed Full Name → Recipient.
      const food = eventTypeService.getTemplate('food_distribution');
      const customizedFields: FormField[] = food.formFields.map(toLocalField);
      customizedFields[0] = { ...customizedFields[0], label: 'Recipient' };

      const fromCustomized: FormBuilderData = {
        fields: customizedFields,
        title: food.defaultName,
        description: '',
      };

      const next = applier.applyTemplate(fromCustomized, 'food_distribution', 'seminar');

      // Customized fields should NOT be silently dropped.
      expect(next.fields.find((f) => f.label === 'Recipient')).toBeDefined();
    });
  });

  describe('applyTemplate (Bug #2: event name)', () => {
    it('replaces the legacy "Registration Form" title with the new template default', () => {
      const legacy: FormBuilderData = {
        fields: [],
        title: 'Registration Form',
        description: '',
      };

      const next = applier.applyTemplate(legacy, null, 'volunteer');
      const volunteer = eventTypeService.getTemplate('volunteer');
      expect(next.title).toBe(volunteer.defaultName);
    });

    it('replaces the title when it equals the previous template\'s defaultName', () => {
      const food = eventTypeService.getTemplate('food_distribution');
      const fromFood: FormBuilderData = {
        fields: [],
        title: food.defaultName, // i.e. user never typed their own name
        description: '',
      };

      const next = applier.applyTemplate(fromFood, 'food_distribution', 'seminar');
      const seminar = eventTypeService.getTemplate('seminar');
      expect(next.title).toBe(seminar.defaultName);
    });

    it('PRESERVES the title when the user has typed a unique event name', () => {
      const userNamed: FormBuilderData = {
        fields: [],
        title: 'Saturday Morning Food Bank — Q4',
        description: '',
      };

      const next = applier.applyTemplate(userNamed, 'food_distribution', 'seminar');
      expect(next.title).toBe('Saturday Morning Food Bank — Q4');
    });

    it('returns a NEW object every call (immutability)', () => {
      const next = applier.applyTemplate(emptyForm, null, 'custom');
      expect(next).not.toBe(emptyForm);
      expect(next.fields).not.toBe(emptyForm.fields);
    });
  });

  describe('isPristine', () => {
    it('returns true for an empty fields array', () => {
      expect(applier.isPristine([], null)).toBe(true);
      expect(applier.isPristine([], 'food_distribution')).toBe(true);
    });

    it('returns true when fields exactly match the previous template', () => {
      const food = eventTypeService.getTemplate('food_distribution');
      const cloned: FormField[] = food.formFields.map(toLocalField);
      expect(applier.isPristine(cloned, 'food_distribution')).toBe(true);
    });

    it('returns false when a label has been customized', () => {
      const food = eventTypeService.getTemplate('food_distribution');
      const cloned: FormField[] = food.formFields.map(toLocalField);
      cloned[0] = { ...cloned[0], label: 'Recipient' };
      expect(applier.isPristine(cloned, 'food_distribution')).toBe(false);
    });

    it('returns false when a field was added that the template does not contain', () => {
      const food = eventTypeService.getTemplate('food_distribution');
      const cloned: FormField[] = food.formFields.map(toLocalField);
      cloned.push({
        id: 'extra',
        type: 'text',
        label: 'Extra',
        required: false,
      });
      expect(applier.isPristine(cloned, 'food_distribution')).toBe(false);
    });
  });
});

/**
 * Helper: the template uses IFormConfigService.FormField (with order/number/date
 * types). The form builder's local FormField is narrower. The applier consumes
 * the local type, so tests coerce the same way the page does.
 */
function toLocalField(f: {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
}): FormField {
  const supported = new Set(['text', 'email', 'phone', 'select', 'textarea', 'checkbox']);
  return {
    id: f.id,
    type: (supported.has(f.type) ? f.type : 'text') as FormField['type'],
    label: f.label,
    placeholder: f.placeholder,
    required: f.required,
  };
}
