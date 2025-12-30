/**
 * Login Page
 * 
 * Handles user authentication via 6-digit email verification codes.
 */

import { LoginClient } from './login-client';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || '/dashboard';
  
  return <LoginClient nextPath={nextPath} />;
}
