'use client';

import { TutorialButton } from '@/components/ui/TutorialButton';
import { TUTORIALS } from '@/lib/tutorials';

export function DashboardTutorialButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TutorialButton
        tutorial={TUTORIALS.dashboard}
        variant="icon"
      />
    </div>
  );
}
