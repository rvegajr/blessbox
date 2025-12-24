import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QRConfigWizard } from '../../components/onboarding/QRConfigWizard';
import type { QRConfigData } from '../../components/OnboardingWizard.interface';

describe('QRConfigWizard - regression: avoid infinite update depth', () => {
  const baseData: QRConfigData = {
    qrCodes: [
      { id: 'qr_1', label: 'Main Entrance', url: '/register/main-entrance', description: 'Primary entry point' },
    ],
    settings: {
      size: 256,
      format: 'png',
      includeLogo: false,
    },
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
      const [data, setData] = useState<QRConfigData>(baseData);
      const [calls, setCalls] = useState(0);

      return (
        <div>
          <div data-testid="calls">{calls}</div>
          <QRConfigWizard
            data={data}
            // recreated every render
            onChange={(next) => {
              setCalls((c) => c + 1);
              setData(next);
            }}
            onGenerate={() => {}}
            onDownload={() => {}}
          />
        </div>
      );
    }

    render(<Wrapper />);

    // Let effects flush
    await new Promise((r) => setTimeout(r, 50));

    const calls = Number(screen.getByTestId('calls').textContent || '0');
    expect(calls).toBeGreaterThanOrEqual(1);
    expect(calls).toBeLessThan(5);

    const errorMessages = consoleErrorSpy.mock.calls.map((c) => String(c[0] ?? ''));
    expect(errorMessages.join('\n')).not.toMatch(/maximum update depth exceeded/i);
  });
});

