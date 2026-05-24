/**
 * IEventTypeFormApplier - Interface Segregation Principle compliant.
 *
 * Single responsibility: decide what `FormBuilderData` should look like
 * after a user picks (or switches) an event-type template inside the
 * form-builder UI. Pure logic — no DOM, no fetch, no storage.
 *
 * Why this exists (Issue #17 retest, Aracela's QA report):
 *
 *   1. "Provided fields on event type are only reflected when refreshed,
 *      not when a choice is picked." → today the page only seeds fields
 *      when the form is empty, so picking a second template silently
 *      does nothing.
 *
 *   2. "No field for 'Event Name' … events page filter shows
 *      'Registration Form' instead of the actual event name." → today
 *      the title is shared with the registration form name and defaults
 *      to the literal "Registration Form" string.
 *
 * Both behaviors are decisions, not data transformations, so they live
 * in their own service. The page becomes a thin renderer.
 */

import type { EventType } from './IEventTypeService';
import type { FormBuilderData, FormField } from '../../components/OnboardingWizard.interface';

export interface IEventTypeFormApplier {
  /**
   * Compute the next FormBuilderData when the user changes the event type.
   *
   * @param current      Current form data on screen.
   * @param prevEventType The event type that was selected before the change
   *                     (null on first selection).
   * @param nextEventType The event type the user just picked.
   *
   * Contract:
   *   - Always returns a *new* FormBuilderData object (never mutates).
   *   - Replaces `fields` with the new template's fields when the current
   *     fields are pristine (empty OR exactly match the previous template).
   *   - Preserves `fields` when the user has manually customized them
   *     (so we don't silently destroy their work).
   *   - Replaces `title` if the current title is empty OR equals the
   *     previous template's defaultName OR equals the literal string
   *     "Registration Form" (legacy default).
   *   - Otherwise preserves the user's typed title.
   */
  applyTemplate(
    current: FormBuilderData,
    prevEventType: EventType | null,
    nextEventType: EventType
  ): FormBuilderData;

  /**
   * Returns true if the given fields look untouched relative to a known
   * template (or are empty). Exposed for the UI so it can decide whether
   * to show a confirmation prompt before applying a new template.
   */
  isPristine(fields: FormField[], prevEventType: EventType | null): boolean;
}
