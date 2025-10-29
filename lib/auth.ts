export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const configured = process.env.SUPERADMIN_EMAIL?.toLowerCase();
  const defaults = ['admin@blessbox.app'];
  const e = email.toLowerCase();
  return (configured ? e === configured : false) || defaults.includes(e);
}

