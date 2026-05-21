/**
 * Phase D: Fix #17b — Dropdown Enter Key
 * TDD Test Suite for FormOptionsSerializer (Red → Green)
 */

import { describe, it, expect } from 'vitest';
import { FormOptionsSerializer } from './FormOptionsSerializer';

describe('FormOptionsSerializer', () => {
  const svc = new FormOptionsSerializer();

  describe('parseInProgress - preserves blanks while typing', () => {
    it('preserves trailing blank line so Enter creates a new option', () => {
      expect(svc.parseInProgress('S\nM\nL\n')).toEqual(['S', 'M', 'L', '']);
    });

    it('preserves interior whitespace lines', () => {
      expect(svc.parseInProgress('S\n\nM')).toEqual(['S', '', 'M']);
    });

    it('preserves multiple trailing newlines', () => {
      expect(svc.parseInProgress('S\nM\n\n')).toEqual(['S', 'M', '', '']);
    });

    it('handles single line with newline', () => {
      expect(svc.parseInProgress('S\n')).toEqual(['S', '']);
    });

    it('handles empty string', () => {
      expect(svc.parseInProgress('')).toEqual(['']);
    });

    it('handles text with no newlines', () => {
      expect(svc.parseInProgress('Single')).toEqual(['Single']);
    });
  });

  describe('parseFinal - drops empty and trims', () => {
    it('drops empty and whitespace-only lines and trims', () => {
      expect(svc.parseFinal('  S  \n\n M \n')).toEqual(['S', 'M']);
    });

    it('drops leading/trailing blank lines', () => {
      expect(svc.parseFinal('\nS\nM\n')).toEqual(['S', 'M']);
    });

    it('trims whitespace from each option', () => {
      expect(svc.parseFinal('  Small  \n  Medium  \n  Large  ')).toEqual(['Small', 'Medium', 'Large']);
    });

    it('returns empty array when all lines are blank', () => {
      expect(svc.parseFinal('\n\n   \n')).toEqual([]);
    });

    it('handles single non-empty line', () => {
      expect(svc.parseFinal('Single')).toEqual(['Single']);
    });

    it('returns empty array for empty string', () => {
      expect(svc.parseFinal('')).toEqual([]);
    });
  });

  describe('serialize - joins with newline', () => {
    it('joins multiple options with newline', () => {
      expect(svc.serialize(['S', 'M'])).toBe('S\nM');
    });

    it('handles single option', () => {
      expect(svc.serialize(['Single'])).toBe('Single');
    });

    it('handles empty array', () => {
      expect(svc.serialize([])).toBe('');
    });

    it('preserves empty strings in the array', () => {
      expect(svc.serialize(['S', '', 'M'])).toBe('S\n\nM');
    });
  });
});
