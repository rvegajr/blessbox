# BlessBox Tutorial System

A comprehensive, framework-agnostic tutorial system built with pure vanilla JavaScript/TypeScript. Features both context-independent tutorials and context-aware triggers that respond to user behavior.

## 🚀 Features

### Context-Independent Tutorials
- **Step-by-step guided tours** with customizable popovers
- **Progress tracking** and completion status
- **Dismissible tutorials** with user preference memory
- **Version management** for tutorial updates
- **localStorage persistence** for completion tracking

### Context-Aware Tutorials
- **Behavioral triggers** based on user actions
- **Smart condition checking** with cooldown periods
- **Priority-based execution** for multiple triggers
- **User action tracking** and analytics
- **DOM observation** for dynamic content

### Framework Agnostic
- **Zero dependencies** on React, Vue, Angular, etc.
- **Pure vanilla JavaScript/TypeScript**
- **Easy integration** with any web application
- **Removable** by simply removing the script tag

## 📁 File Structure

```
public/tutorials/
├── tutorial-engine.ts          # Context-independent tutorial system
├── context-aware-engine.ts     # Context-aware trigger system
├── tutorial-definitions.ts      # Pre-configured tutorials and triggers
├── index.ts                    # Integration script
├── demo.html                   # Interactive demo page
└── README.md                   # This file

tests/vanilla-js/
├── setup.ts                    # Test environment setup
├── tutorial-engine.test.ts     # Tests for context-independent system
└── context-aware-engine.test.ts # Tests for context-aware system
```

## 🛠 Installation

### 1. Copy Files
Copy the tutorial system files to your project:

```bash
# Copy the entire tutorials directory
cp -r public/tutorials/ /path/to/your/project/public/
```

### 2. Include in HTML
Add the tutorial system to your HTML:

```html
<!-- Option 1: ES6 Modules -->
<script type="module" src="/tutorials/index.js"></script>

<!-- Option 2: Direct script inclusion -->
<script src="/tutorials/tutorial-engine.js"></script>
<script src="/tutorials/context-aware-engine.js"></script>
<script src="/tutorials/tutorial-definitions.js"></script>
```

### 3. Initialize
The system auto-initializes, but you can also initialize manually:

```javascript
// Auto-initialization happens on page load
// Manual initialization (optional)
BlessBoxTutorialSystem.checkContextTriggers();
```

## 📖 Usage

### Basic Tutorial Management

```javascript
// Start a tutorial
BlessBoxTutorialSystem.startTutorial('welcome-tour');

// Check if tutorial is completed
const isCompleted = BlessBoxTutorialSystem.isTutorialCompleted('welcome-tour');

// Mark tutorial as completed
BlessBoxTutorialSystem.markTutorialCompleted('welcome-tour', 1);

// Reset tutorial (allow it to show again)
BlessBoxTutorialSystem.resetTutorial('welcome-tour');
```

### Context Tracking

```javascript
// Track user actions for context-aware triggers
BlessBoxTutorialSystem.trackAction('button-click', { buttonId: 'create-qr' });
BlessBoxTutorialSystem.trackAction('page-view', { page: '/dashboard' });
BlessBoxTutorialSystem.trackAction('feature-used', { feature: 'analytics' });

// Manually check context triggers
BlessBoxTutorialSystem.checkContextTriggers();
```

### Custom Tutorial Definition

```javascript
// Register a custom tutorial
const customTutorial = {
  id: 'my-custom-tour',
  version: 1,
  dismissible: true,
  autoStart: false,
  steps: [
    {
      element: '#my-element',
      popover: {
        title: 'My Tutorial Step',
        description: 'This is a custom tutorial step.',
        side: 'bottom'
      }
    }
  ]
};

// Register with the system
window.blessboxTutorials.registerTutorial(customTutorial);
```

### Custom Context Trigger

```javascript
// Register a custom context trigger
const customTrigger = {
  id: 'my-custom-trigger',
  name: 'My Custom Trigger',
  condition: () => {
    // Return true when tutorial should trigger
    return document.querySelector('#special-element') !== null;
  },
  tutorial: 'my-custom-tour',
  priority: 50,
  cooldown: 6, // 6 hours
  maxShows: 2,
  dismissible: true
};

// Register with the system
window.contextTutorials.registerTrigger(customTrigger);
```

## 🎯 Pre-configured Tutorials

The system comes with several pre-configured tutorials:

### Welcome Tour (`welcome-tour`)
- Introduces new users to BlessBox
- Shows main features and navigation
- Triggers on first visit

### Dashboard Tour (`dashboard-tour`)
- Explains dashboard components
- Shows statistics and activity sections
- Triggers when dashboard is empty

### QR Creation Tour (`qr-creation-tour`)
- Guides through QR code creation
- Shows form fields and preview
- Triggers after multiple failed attempts

### Event Management Tour (`event-management-tour`)
- Explains event management features
- Shows analytics and export options
- Triggers for users with events but no analytics usage

### Team Management Tour (`team-management-tour`)
- Guides through team invitation process
- Shows role and permission settings
- Triggers after multiple invite attempts

## 🔧 Configuration

### Tutorial Configuration

```typescript
interface Tutorial {
  id: string;                    // Unique identifier
  version: number;               // Version for updates
  dismissible: boolean;          // Can user dismiss?
  autoStart: boolean;           // Start automatically?
  steps: TutorialStep[];         // Array of tutorial steps
}

interface TutorialStep {
  element: string;              // CSS selector for target element
  popover: {
    title: string;              // Popover title
    description: string;         // Popover description
    side: 'top' | 'bottom' | 'left' | 'right'; // Popover position
  };
}
```

### Context Trigger Configuration

```typescript
interface ContextTrigger {
  id: string;                   // Unique identifier
  name: string;                 // Human-readable name
  condition: () => boolean;     // Function that returns true when trigger should fire
  tutorial: string;             // Tutorial ID to start
  priority?: number;            // Higher priority triggers first (default: 0)
  cooldown?: number;           // Hours between triggers (default: 0)
  maxShows?: number;           // Maximum times to show (default: 1)
  dismissible?: boolean;        // Can user dismiss? (default: true)
}
```

## 🧪 Testing

The tutorial system includes comprehensive tests:

```bash
# Run all tutorial tests
npm test -- tests/vanilla-js/

# Run specific test suites
npm test -- tests/vanilla-js/tutorial-engine.test.ts
npm test -- tests/vanilla-js/context-aware-engine.test.ts
```

### Test Coverage
- ✅ Tutorial registration and management
- ✅ Step navigation and completion
- ✅ localStorage persistence
- ✅ Context trigger conditions
- ✅ User action tracking
- ✅ DOM observation
- ✅ Error handling

## 🎨 Styling

The tutorial system uses inline styles for maximum compatibility. To customize the appearance:

```css
/* Override tutorial popover styles */
#tutorial-popover {
  background-color: #your-color !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
}

/* Override highlight styles */
#tutorial-highlight {
  border-color: #your-color !important;
  border-width: 3px !important;
}
```

## 🔍 Debugging

Enable debug mode for detailed logging:

```javascript
// Enable debug logging
const tutorials = new BlessBoxTutorials({ debug: true });
const contextTutorials = new ContextAwareTutorials();
```

Debug output includes:
- Tutorial registration events
- Trigger condition evaluations
- User action tracking
- Storage operations
- Error messages

## 📊 Analytics

The system tracks tutorial engagement:

```javascript
// Get tutorial completion data
const completionData = JSON.parse(localStorage.getItem('blessbox_tutorials') || '{}');

// Get user action history
const actionHistory = JSON.parse(localStorage.getItem('blessbox_user_actions') || '[]');

// Get context trigger data
const triggerData = JSON.parse(localStorage.getItem('blessbox_context_tutorials') || '{}');
```

## 🚀 Demo

Try the interactive demo:

1. Open `public/tutorials/demo.html` in your browser
2. Click "Start Welcome Tour" to see context-independent tutorials
3. Use "Demo Actions" to trigger context-aware tutorials
4. Check the browser console for debug information

## 🤝 Contributing

1. Write tests for new features
2. Follow the existing code style
3. Update documentation
4. Ensure all tests pass

## 📄 License

This tutorial system is part of the BlessBox project and follows the same license terms.

## 🆘 Support

For issues or questions:
1. Check the demo page for examples
2. Review the test files for usage patterns
3. Enable debug mode for detailed logging
4. Check browser console for error messages

---

**Built with ❤️ for BlessBox - Making QR code check-ins beautiful and intuitive.**

