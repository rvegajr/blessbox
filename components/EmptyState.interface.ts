// src/interfaces/EmptyState.interface.ts
export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  helpLink?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
  'data-testid'?: string;
}

export interface EmptyStateComponent {
  render(): React.ReactElement<EmptyStateProps>;
}
