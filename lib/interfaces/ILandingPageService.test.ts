// ILandingPageService Interface Tests - ISP compliance + behavior contract
// Issue: #33 - Public landing page and product marketing

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ILandingPageService,
  ISeoMetadataProvider,
  ILandingSectionProvider,
  ICtaResolver,
  LandingPageSection,
} from './ILandingPageService';
import type { EventType, EventTypeTemplate, IEventTypeReader } from './IEventTypeService';

class MockLandingPageService implements ILandingPageService {
  private sections: LandingPageSection[] = [
    { id: 'hero', title: 'BlessBox', type: 'hero', visible: true },
    { id: 'features', title: 'Features', type: 'features', visible: true },
    { id: 'pricing', title: 'Pricing', type: 'pricing', visible: true },
    { id: 'event-types', title: 'Event Types', type: 'event-types', visible: true },
    { id: 'cta', title: 'Get Started', type: 'cta', visible: true },
  ];

  getSeoMetadata() {
    return {
      title: 'BlessBox — QR-based registration and verification',
      description: 'Streamlined QR-based registration and verification system for organizations',
      ogTitle: 'BlessBox',
      ogDescription: 'Streamlined QR-based registration and verification system for organizations',
      ogImage: 'https://www.blessbox.org/og-image.png',
      canonicalUrl: 'https://www.blessbox.org/',
    };
  }

  getSections(): LandingPageSection[] {
    return this.sections.filter((s) => s.visible);
  }

  isSectionVisible(sectionId: string): boolean {
    return this.sections.find((s) => s.id === sectionId)?.visible === true;
  }

  resolvePrimaryCta(args: { authenticated: boolean }) {
    if (args.authenticated) {
      return {
        href: '/dashboard' as const,
        label: 'Go to Dashboard',
        authState: 'authenticated' as const,
      };
    }
    return {
      href: '/onboarding/organization-setup' as const,
      label: 'Get Started',
      authState: 'anonymous' as const,
    };
  }

  // IEventTypeReader (composed from existing interface — no duplication)
  listEventTypes(): EventType[] {
    return ['food_distribution', 'seminar', 'volunteer', 'custom'];
  }

  isValidEventType(value: unknown): value is EventType {
    return typeof value === 'string' && this.listEventTypes().includes(value as EventType);
  }

  getTemplate(eventType: EventType): EventTypeTemplate {
    return {
      eventType,
      defaultName: eventType.replace('_', ' '),
      formFields: [
        { id: 'name', type: 'text', label: 'Name', required: true } as any,
        { id: 'email', type: 'email', label: 'Email', required: true } as any,
      ],
      suggestedRoles: eventType === 'volunteer' ? ['volunteer', 'lead'] : [],
    };
  }

  getDefaultEventType(): EventType {
    return 'custom';
  }
}

describe('ILandingPageService Interface (ISP)', () => {
  let service: ILandingPageService;

  beforeEach(() => {
    service = new MockLandingPageService();
  });

  describe('Interface Segregation', () => {
    it('SEO provider exposes only metadata accessor', () => {
      const seo: ISeoMetadataProvider = service;
      expect(typeof seo.getSeoMetadata).toBe('function');
    });

    it('Section provider exposes only section accessors', () => {
      const sections: ILandingSectionProvider = service;
      expect(typeof sections.getSections).toBe('function');
      expect(typeof sections.isSectionVisible).toBe('function');
    });

    it('CTA resolver exposes only resolvePrimaryCta', () => {
      const cta: ICtaResolver = service;
      expect(typeof cta.resolvePrimaryCta).toBe('function');
    });

    it('composes the existing IEventTypeReader (no duplication of EventTypeService)', () => {
      const reader: IEventTypeReader = service;
      expect(typeof reader.listEventTypes).toBe('function');
      expect(typeof reader.isValidEventType).toBe('function');
      expect(typeof reader.getTemplate).toBe('function');
      expect(typeof reader.getDefaultEventType).toBe('function');
    });
  });

  describe('SEO metadata (Aracela checklist - og: tags)', () => {
    it('provides title, description, og:title, og:description', () => {
      const meta = service.getSeoMetadata();
      expect(meta.title).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.ogTitle).toBeTruthy();
      expect(meta.ogDescription).toBeTruthy();
    });

    it('mentions the BlessBox brand in title', () => {
      expect(service.getSeoMetadata().title).toContain('BlessBox');
    });
  });

  describe('Sections', () => {
    it('returns visible sections only', () => {
      const sections = service.getSections();
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.every((s) => s.visible)).toBe(true);
    });

    it('includes the marketing-essential sections', () => {
      const ids = service.getSections().map((s) => s.id);
      expect(ids).toContain('hero');
      expect(ids).toContain('features');
      expect(ids).toContain('cta');
    });

    it('isSectionVisible reflects visibility flag', () => {
      expect(service.isSectionVisible('hero')).toBe(true);
      expect(service.isSectionVisible('does-not-exist')).toBe(false);
    });
  });

  describe('CTA resolution (Aracela checklist - dashboard shortcut)', () => {
    it('anonymous users go to onboarding with "Get Started"', () => {
      const cta = service.resolvePrimaryCta({ authenticated: false });
      expect(cta.href).toBe('/onboarding/organization-setup');
      expect(cta.label).toBe('Get Started');
      expect(cta.authState).toBe('anonymous');
    });

    it('authenticated users get a dashboard shortcut', () => {
      const cta = service.resolvePrimaryCta({ authenticated: true });
      expect(cta.href).toBe('/dashboard');
      expect(cta.label).toMatch(/Dashboard/i);
      expect(cta.authState).toBe('authenticated');
    });
  });

  describe('Event-type template gallery via composed IEventTypeReader (Aracela suggestion)', () => {
    it('exposes the four event types', () => {
      const types = service.listEventTypes();
      expect(types).toEqual(
        expect.arrayContaining(['food_distribution', 'seminar', 'volunteer', 'custom'])
      );
    });

    it('returns a starter template with form fields per event type', () => {
      const preview = service.getTemplate('food_distribution');
      expect(preview.eventType).toBe('food_distribution');
      expect(preview.formFields.length).toBeGreaterThan(0);
      expect(preview.defaultName).toBeTruthy();
    });

    it('volunteer template surfaces suggested roles', () => {
      const preview = service.getTemplate('volunteer');
      expect(preview.suggestedRoles.length).toBeGreaterThan(0);
    });

    it('custom template has no suggested roles by default', () => {
      const preview = service.getTemplate('custom');
      expect(preview.suggestedRoles).toEqual([]);
    });

    it('isValidEventType narrows correctly', () => {
      expect(service.isValidEventType('seminar')).toBe(true);
      expect(service.isValidEventType('not-a-type')).toBe(false);
    });
  });
});
