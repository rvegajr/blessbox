// src/interfaces/ProgressIndicator.interface.ts
export interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  'data-testid'?: string;
}

export interface ProgressIndicatorComponent {
  render(): React.ReactElement<ProgressIndicatorProps>;
  getProgress(): number; // Returns percentage (0-100)
  isComplete(): boolean;
}
