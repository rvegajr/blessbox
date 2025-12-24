import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormBuilderWizard } from '../../components/onboarding/FormBuilderWizard';
import type { FormBuilderData } from '../../components/OnboardingWizard.interface';

describe('FormBuilderWizard - regression: avoid infinite update depth', () => {
  const baseData: FormBuilderData = {
    fields: [],
    title: 'Registration Form',
    description: '',
  };

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('does not infinitely rerender when parent recreates onChange each render', async () => {
    function Wrapper() {
      const [data, setData] = useState<FormBuilderData>(baseData);
      const [calls, setCalls] = useState(0);

      return (
        <div>
          <div data-testid="calls">{calls}</div>
          <FormBuilderWizard
            data={data}
            // This inline function is recreated every render
            onChange={(next) => {
              setCalls((c) => c + 1);
              setData(next);
            }}
            onPreview={() => {}}
          />
        </div>
      );
    }

    render(<Wrapper />);

    // Let effects flush
    await new Promise((r) => setTimeout(r, 50));

    const calls = Number(screen.getByTestId('calls').textContent || '0');

    // Previously this would spiral until React throws "Maximum update depth exceeded".
    // With the fix, we should stabilize quickly (typically 1 call on mount).
    expect(calls).toBeGreaterThanOrEqual(1);
    expect(calls).toBeLessThan(5);

    const errorMessages = consoleErrorSpy.mock.calls.map((c) => String(c[0] ?? ''));
    expect(errorMessages.join('\n')).not.toMatch(/maximum update depth exceeded/i);
  });
});

