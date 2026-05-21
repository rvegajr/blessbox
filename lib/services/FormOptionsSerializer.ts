/**
 * Phase D: Form Options Serializer Implementation
 * Pure logic for textarea ↔ options array conversion
 */

import type { IFormOptionsSerializer } from '../interfaces/IFormOptionsSerializer';

export class FormOptionsSerializer implements IFormOptionsSerializer {
  parseInProgress(text: string): string[] {
    return text.split('\n');
  }

  parseFinal(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  serialize(options: string[]): string {
    return options.join('\n');
  }
}
