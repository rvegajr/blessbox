import { redirect } from 'next/navigation';

/**
 * /dashboard/classes → /classes
 *
 * The classes feature lives at /classes (not /dashboard/classes).
 * This redirect keeps UAT test scripts and any bookmarked URLs working.
 */
export default function DashboardClassesRedirect() {
  redirect('/classes');
}
