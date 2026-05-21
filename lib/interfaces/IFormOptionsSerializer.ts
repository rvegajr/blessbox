/**
 * Phase D: ISP interface for Form Options Serialization
 * Handles textarea ↔ options array conversion for dropdown fields
 */

export interface IFormOptionsSerializer {
  /**
   * While typing — preserves user keystrokes including blank lines
   * @param text - Raw textarea value
   * @returns Array of options (may include empty strings)
   */
  parseInProgress(text: string): string[];

  /**
   * On blur or save — trims and drops empties
   * @param text - Raw textarea value
   * @returns Array of non-empty, trimmed options
   */
  parseFinal(text: string): string[];

  /**
   * Serialize back to textarea string
   * @param options - Array of option strings
   * @returns Newline-joined string
   */
  serialize(options: string[]): string;
}
