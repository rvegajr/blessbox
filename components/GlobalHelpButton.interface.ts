/**
 * GlobalHelpButton Interface
 * Defines the props and component interface for the global help button
 */

import React from 'react';

export interface GlobalHelpButtonProps {
  /**
   * Custom className for the button container
   */
  className?: string;
  
  /**
   * Custom test ID for testing
   */
  'data-testid'?: string;
  
  /**
   * Position of the button (default: 'bottom-right')
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /**
   * Custom tutorials to display in the drawer
   */
  customTutorials?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  
  /**
   * Whether to show the button (default: true)
   */
  show?: boolean;
}

export interface GlobalHelpButtonComponent {
  /**
   * Open the help drawer
   */
  open(): void;
  
  /**
   * Close the help drawer
   */
  close(): void;
  
  /**
   * Toggle the help drawer
   */
  toggle(): void;
}

