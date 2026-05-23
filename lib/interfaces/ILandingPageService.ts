// ILandingPageService - Interface Segregation Principle Compliant
// Single responsibility: provide content + navigation logic for the public landing page
//
// Issue: #33 - Public landing page and product marketing
//
// ISP rationale: SEO/meta consumers (server-render head) and CTA logic
// (client-side routing) are independent concerns and should not couple.

import type { IEventTypeReader } from './IEventTypeService';

export interface SeoMetadata {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface LandingPageSection {
  id: string;
  title: string;
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'event-types';
  visible: boolean;
}

export type CtaTarget = '/onboarding/organization-setup' | '/login' | '/signup' | '/dashboard';

export interface CtaResolution {
  href: CtaTarget;
  label: string;
  authState: 'anonymous' | 'authenticated';
}

/**
 * Read-only SEO metadata provider for the page <head>. Consumed by both
 * server-rendered metadata helpers and social-share previews.
 */
export interface ISeoMetadataProvider {
  getSeoMetadata(): SeoMetadata;
}

/**
 * Read-only section configuration for the landing page body.
 * Lets us hide/show sections without code changes.
 */
export interface ILandingSectionProvider {
  getSections(): LandingPageSection[];
  isSectionVisible(sectionId: string): boolean;
}

/**
 * Decides where the primary CTA should send the user based on auth state.
 * Aracela edge case: logged-in users should see a dashboard shortcut.
 */
export interface ICtaResolver {
  resolvePrimaryCta(args: { authenticated: boolean }): CtaResolution;
}

/**
 * Combined facade for the landing page. Page-level components depend on this;
 * unit-test seams use the segregated interfaces above.
 *
 * Aracela's UX feedback ("starter event-type templates") is satisfied by
 * composing the existing `IEventTypeReader` rather than re-defining a parallel
 * gallery interface — single source of truth for event types and templates.
 */
export interface ILandingPageService
  extends ISeoMetadataProvider,
    ILandingSectionProvider,
    ICtaResolver,
    IEventTypeReader {}
