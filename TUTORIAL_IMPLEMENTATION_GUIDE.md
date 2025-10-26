# BlessBox Tutorial System - Implementation Guide

## Overview

We've implemented a **non-intrusive, opt-in tutorial system** that helps users learn BlessBox without interrupting their workflow. Users can trigger tutorials whenever they need help.

## What's Been Implemented

### 1. Tutorial System (`useTutorial` Hook)

**Location:** `src/hooks/useTutorial.ts`

**Features:**
- Tracks which tutorials users have seen (stored in localStorage)
- Allows users to replay tutorials anytime
- Progress indicator showing step number
- Clean, dismissible interface

**Usage:**
```tsx
import { useTutorial } from '@/hooks/useTutorial';
import { TUTORIALS } from '@/lib/tutorials';

function MyComponent() {
  const { startTutorial } = useTutorial();

  return (
    <button onClick={() => startTutorial(TUTORIALS.dashboard)}>
      Start Tutorial
    </button>
  );
}
```

### 2. Tutorial Button Component

**Location:** `src/components/ui/TutorialButton.tsx`

**Three Display Variants:**

**Icon Variant** (Floating Button):
```tsx
<TutorialButton tutorial={TUTORIALS.dashboard} variant="icon" />
```
- Circular blue button with "?" icon
- Perfect for floating in corner of page
- Unobtrusive but visible

**Button Variant** (Full Button):
```tsx
<TutorialButton tutorial={TUTORIALS.dashboard} variant="button" />
```
- Full button with "Start Tutorial" text
- Good for prominent placement

**Link Variant** (Text Link):
```tsx
<TutorialButton tutorial={TUTORIALS.dashboard} variant="link" />
```
- Simple text link
- Minimal visual impact

### 3. Help Tooltip Component

**Location:** `src/components/ui/HelpTooltip.tsx`

**Usage:**
```tsx
<div className="flex items-center gap-2">
  <label>Organization Name</label>
  <HelpTooltip
    content="This name will appear on all registration forms and QR codes"
    position="right"
  />
</div>
```

**Features:**
- Shows on hover
- Four position options: top, right, bottom, left
- Accessible (keyboard navigation)
- Mobile-friendly

### 4. Empty State Component

**Location:** `src/components/ui/EmptyState.tsx`

**Usage:**
```tsx
<EmptyState
  icon={<QRCodeIcon />}
  title="No QR Codes Yet"
  description="Create your first QR code to start collecting registrations. It only takes a minute!"
  action={{
    label: "Create QR Code",
    onClick: () => router.push('/dashboard/qr-codes/create')
  }}
  secondaryAction={{
    label: "Watch Tutorial",
    onClick: () => startTutorial(TUTORIALS.qrConfiguration)
  }}
/>
```

**Features:**
- Icon support
- Primary and secondary actions
- Helpful, encouraging messaging

### 5. Pre-built Tutorials

**Location:** `src/lib/tutorials.ts`

**Available Tutorials:**

1. **Dashboard Tour** (`TUTORIALS.dashboard`)
   - Organization stats overview
   - QR code management
   - Recent activity
   - Quick actions

2. **Form Builder** (`TUTORIALS.formBuilder`)
   - Field types
   - Live preview
   - Field editor
   - Form settings

3. **QR Configuration** (`TUTORIALS.qrConfiguration`)
   - QR code set naming
   - Entry points
   - QR code list
   - Preview and download

4. **Onboarding** (`TUTORIALS.onboarding`)
   - Progress indicator
   - Organization form
   - Submit process

5. **Email Verification** (`TUTORIALS.emailVerification`)
   - Code entry
   - Resend functionality
   - Help section

6. **Registrations** (`TUTORIALS.registrations`)
   - Data viewing
   - Export functionality
   - Filtering
   - Check-in status

## How to Add Tutorials to Your Pages

### Step 1: Add Tutorial Button

**For Floating Corner Button (Recommended):**

Create a client component wrapper:

```tsx
// src/app/your-page/YourPageClient.tsx
'use client';

import { TutorialButton } from '@/components/ui/TutorialButton';
import { TUTORIALS } from '@/lib/tutorials';

export function YourPageTutorialButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TutorialButton
        tutorial={TUTORIALS.yourTutorial}
        variant="icon"
      />
    </div>
  );
}
```

Then add to your server component:

```tsx
// src/app/your-page/page.tsx
import { YourPageTutorialButton } from './YourPageClient';

export default function YourPage() {
  return (
    <div>
      {/* Your page content */}

      {/* Tutorial button */}
      <YourPageTutorialButton />
    </div>
  );
}
```

### Step 2: Add IDs to Elements

For tutorials to work, add IDs to the elements you want to highlight:

```tsx
<div id="dashboard-stats">
  <OrganizationStats />
</div>

<div id="qr-codes-section">
  <QRCodeSetsList />
</div>
```

### Step 3: Add Help Tooltips

Add contextual help throughout your forms:

```tsx
<div className="space-y-4">
  <div>
    <label className="flex items-center gap-2">
      Organization Name
      <HelpTooltip
        content="This is the name that will appear on registration forms"
        position="right"
      />
    </label>
    <input type="text" name="orgName" />
  </div>
</div>
```

### Step 4: Add Empty States

Replace empty content areas with helpful empty states:

```tsx
{qrCodes.length === 0 ? (
  <EmptyState
    icon={<QRCodeIcon className="w-16 h-16" />}
    title="No QR Codes Yet"
    description="Create your first QR code to start collecting registrations."
    action={{
      label: "Create QR Code",
      onClick: handleCreate
    }}
    secondaryAction={{
      label: "Watch Tutorial",
      onClick: () => startTutorial(TUTORIALS.qrConfiguration)
    }}
  />
) : (
  <QRCodeList codes={qrCodes} />
)}
```

## Creating Custom Tutorials

### Add to `src/lib/tutorials.ts`:

```typescript
export const TUTORIALS: Record<string, Tutorial> = {
  // ... existing tutorials

  myNewFeature: {
    id: 'my-new-feature',
    name: 'My New Feature Tutorial',
    steps: [
      {
        element: '#feature-overview',
        popover: {
          title: 'Feature Overview',
          description: 'This is where you can access the main feature controls.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#feature-settings',
        popover: {
          title: 'Feature Settings',
          description: 'Configure your preferences here.',
          side: 'right',
        },
      },
      {
        element: '#save-button',
        popover: {
          title: 'Save Your Changes',
          description: 'Don\'t forget to save when you\'re done!',
          side: 'top',
        },
      },
    ],
  },
};
```

## Best Practices

### 1. Tutorial Design
- **Keep it short:** 3-5 steps maximum
- **Focus on value:** Show features that help users succeed
- **Clear descriptions:** Use simple, action-oriented language
- **Logical flow:** Guide users through a natural workflow

### 2. Placement
- **Floating button:** Bottom-right corner (doesn't block content)
- **Help tooltips:** Next to confusing labels or complex fields
- **Empty states:** Anywhere with no data yet

### 3. When to Show Tutorials
- **Never force:** Let users choose when to learn
- **Suggest at key moments:** Empty states, first visit
- **Make accessible:** Always visible but not intrusive

### 4. Copy Guidelines

**Tooltip Copy:**
- Short (1-2 sentences)
- Explains "why" not just "what"
- Example: ✅ "This helps track which entry point drove most registrations" vs ❌ "Entry point selector"

**Tutorial Step Copy:**
- Title: Action or feature name (3-5 words)
- Description: What users can do and why (1-2 sentences)
- Friendly, encouraging tone

**Empty State Copy:**
- Title: State the obvious (3-5 words)
- Description: Encourage action (1-2 sentences)
- Action: Clear, actionable verb ("Create", "Add", "Start")

## Example Implementation

Here's the dashboard implementation as reference:

```tsx
// src/app/dashboard/page.tsx
import { DashboardTutorialButton } from './DashboardClient';

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6">
        <div id="dashboard-stats">
          <OrganizationStats />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div id="qr-codes-section">
            <QRCodeSetsList />
          </div>

          <div id="recent-activity">
            <RecentActivity />
          </div>
        </div>

        <div id="quick-actions">
          {/* Quick action buttons */}
        </div>
      </main>

      <DashboardTutorialButton />
    </div>
  );
}
```

## User Flow

1. **User lands on page** → Sees floating tutorial button in corner
2. **User clicks tutorial button** → Interactive tour begins
3. **Each step highlights an element** → User sees exactly what's being explained
4. **User can dismiss anytime** → No interruption to workflow
5. **Tutorial marked as seen** → Won't auto-show again (but can be replayed)

## Testing Your Tutorials

1. **Visual check:**
   ```bash
   npm run dev
   ```
   Visit page and click tutorial button

2. **Test each step:**
   - Do all IDs match?
   - Are descriptions clear?
   - Is the order logical?

3. **Test responsiveness:**
   - Check on mobile
   - Verify tooltips don't overflow

4. **Reset tutorial state:**
   ```javascript
   // In browser console
   localStorage.removeItem('blessbox-tutorials');
   ```

## Styling Customization

The tutorial uses Driver.js CSS. To customize:

```css
/* In your global CSS */
.driver-popover {
  background: your-color;
  border-radius: your-radius;
}

.driver-popover-title {
  font-size: your-size;
  color: your-color;
}
```

## Accessibility

All components are accessible:
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ High contrast support

## Next Steps

### Phase 2 (Recommended):
1. Add tutorials to all major pages:
   - Form Builder
   - QR Configuration
   - Registrations
   - Settings

2. Create video walkthroughs:
   - Record 2-minute overview
   - Link from dashboard
   - Embed in welcome email

3. Add contextual help tooltips:
   - All form fields
   - Complex settings
   - Data export options

### Phase 3 (Future):
1. Interactive demo mode
2. Guided product tours
3. In-app help center
4. Video tutorials library

## Support

For questions or issues:
- Check this guide first
- Test in development
- Review Driver.js docs: https://driverjs.com

---

**Built with:**
- Driver.js (tutorials)
- React (components)
- Tailwind CSS (styling)
- Next.js 14 (framework)
