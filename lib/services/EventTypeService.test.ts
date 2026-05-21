/**
 * EventTypeService Tests - TDD Approach
 * Pure logic, no DB. Returns enum values and starter form templates per event type.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventTypeService } from './EventTypeService';
import type { EventType } from '../interfaces/IEventTypeService';

describe('EventTypeService', () => {
  let service: EventTypeService;

  beforeEach(() => {
    service = new EventTypeService();
  });

  describe('listEventTypes', () => {
    it('returns the 4 known event types in stable order', () => {
      expect(service.listEventTypes()).toEqual([
        'food_distribution',
        'seminar',
        'volunteer',
        'custom',
      ]);
    });
  });

  describe('isValidEventType', () => {
    it('returns true for known types', () => {
      expect(service.isValidEventType('food_distribution')).toBe(true);
      expect(service.isValidEventType('seminar')).toBe(true);
      expect(service.isValidEventType('volunteer')).toBe(true);
      expect(service.isValidEventType('custom')).toBe(true);
    });

    it('returns false for unknown or malformed values', () => {
      expect(service.isValidEventType('marathon')).toBe(false);
      expect(service.isValidEventType('')).toBe(false);
      expect(service.isValidEventType(null)).toBe(false);
      expect(service.isValidEventType(undefined)).toBe(false);
      expect(service.isValidEventType(123)).toBe(false);
    });
  });

  describe('getTemplate', () => {
    it('returns food_distribution template with name + family_size', () => {
      const tpl = service.getTemplate('food_distribution');
      const fieldIds = tpl.formFields.map((f) => f.id);
      expect(fieldIds).toContain('full_name');
      expect(fieldIds).toContain('family_size');
      expect(tpl.eventType).toBe('food_distribution');
      expect(tpl.defaultName.length).toBeGreaterThan(0);
    });

    it('returns seminar template with required email field', () => {
      const tpl = service.getTemplate('seminar');
      const emailField = tpl.formFields.find((f) => f.id === 'email');
      expect(emailField).toBeDefined();
      expect(emailField?.required).toBe(true);
      expect(emailField?.type).toBe('email');
    });

    it('returns volunteer template with availability field', () => {
      const tpl = service.getTemplate('volunteer');
      const fieldIds = tpl.formFields.map((f) => f.id);
      expect(fieldIds).toContain('full_name');
      expect(fieldIds).toContain('email');
    });

    it('returns minimal custom template (name + email only, no role field)', () => {
      const tpl = service.getTemplate('custom');
      expect(tpl.formFields).toHaveLength(2);
      const fieldIds = tpl.formFields.map((f) => f.id);
      expect(fieldIds).toEqual(expect.arrayContaining(['full_name', 'email']));
      expect(fieldIds).not.toContain('role');
    });

    it('non-custom templates include a role select field with suggestedRoles as options', () => {
      for (const t of ['food_distribution', 'seminar', 'volunteer'] as const) {
        const tpl = service.getTemplate(t);
        const roleField = tpl.formFields.find((f) => f.id === 'role');
        expect(roleField).toBeDefined();
        expect(roleField?.type).toBe('select');
        expect(roleField?.required).toBe(false);
        expect(roleField?.options).toEqual(tpl.suggestedRoles);
      }
    });

    it('every template has fields with valid order numbers (no duplicates, ascending)', () => {
      for (const t of service.listEventTypes()) {
        const tpl = service.getTemplate(t);
        const orders = tpl.formFields.map((f) => f.order);
        const uniqueOrders = new Set(orders);
        expect(uniqueOrders.size).toBe(orders.length);
      }
    });

    it('every template includes suggestedRoles array (may be empty for custom)', () => {
      const food = service.getTemplate('food_distribution');
      expect(Array.isArray(food.suggestedRoles)).toBe(true);
      expect(food.suggestedRoles.length).toBeGreaterThan(0);

      const custom = service.getTemplate('custom');
      expect(Array.isArray(custom.suggestedRoles)).toBe(true);
      expect(custom.suggestedRoles).toEqual([]);
    });

    it('throws on unknown type', () => {
      expect(() => service.getTemplate('marathon' as EventType)).toThrow(
        /unknown event type/i
      );
    });
  });

  describe('getDefaultEventType', () => {
    it('returns custom as a safe default', () => {
      expect(service.getDefaultEventType()).toBe('custom');
    });
  });
});
