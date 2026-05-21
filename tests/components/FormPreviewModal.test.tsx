/**
 * Phase C: Fix #17a — Preview Modal
 * TDD Test Suite for FormPreviewModal (Red → Green)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';
import type { FormBuilderData } from '@/components/OnboardingWizard.interface';

describe('FormPreviewModal', () => {
  const mockFormData: FormBuilderData = {
    title: 'Test Event Registration',
    description: 'This is a test event',
    fields: [
      { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
      { id: '2', type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true },
    ],
  };

  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <FormPreviewModal isOpen={false} onClose={vi.fn()} formData={mockFormData} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the form title when isOpen=true', () => {
    render(
      <FormPreviewModal isOpen={true} onClose={vi.fn()} formData={mockFormData} />
    );
    expect(screen.getByText('Test Event Registration')).toBeInTheDocument();
  });

  it('renders the form description when isOpen=true', () => {
    render(
      <FormPreviewModal isOpen={true} onClose={vi.fn()} formData={mockFormData} />
    );
    expect(screen.getByText('This is a test event')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <FormPreviewModal isOpen={true} onClose={vi.fn()} formData={mockFormData} />
    );
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <FormPreviewModal isOpen={true} onClose={onClose} formData={mockFormData} />
    );
    const closeButton = screen.getByLabelText('Close preview');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <FormPreviewModal isOpen={true} onClose={onClose} formData={mockFormData} />
    );
    const backdrop = screen.getByTestId('form-preview-modal');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal content', () => {
    const onClose = vi.fn();
    render(
      <FormPreviewModal isOpen={true} onClose={onClose} formData={mockFormData} />
    );
    const title = screen.getByText('Test Event Registration');
    fireEvent.click(title);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows empty state when no fields are present', () => {
    const emptyFormData: FormBuilderData = {
      title: 'Empty Form',
      description: '',
      fields: [],
    };
    render(
      <FormPreviewModal isOpen={true} onClose={vi.fn()} formData={emptyFormData} />
    );
    expect(screen.getByText(/No fields added yet/i)).toBeInTheDocument();
  });
});
