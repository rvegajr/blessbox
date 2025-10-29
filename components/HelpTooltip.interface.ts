// src/interfaces/HelpTooltip.interface.ts
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface HelpTooltipProps {
  content: string | React.ReactNode;
  position?: TooltipPosition;
  maxWidth?: string;
  className?: string;
  'data-testid'?: string;
  disabled?: boolean;
}

export interface HelpTooltipComponent {
  show(): void;
  hide(): void;
  toggle(): void;
}
