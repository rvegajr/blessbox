import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

function isAuthorizedBySecret(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const cronSecret = process.env.CRON_SECRET;
  const diagnosticsSecret = process.env.DIAGNOSTICS_SECRET;
  return !!token && ((cronSecret && token === cronSecret) || (diagnosticsSecret && token === diagnosticsSecret));
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true;
  if (isAuthorizedBySecret(req)) return true;

  const session = await getServerSession();
  const superAdmin = process.env.SUPERADMIN_EMAIL;
  return !!session?.user?.email && !!superAdmin && session.user.email === superAdmin;
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; json?: any; text?: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => undefined);
      return { ok: res.ok, status: res.status, json };
    }
    const text = await res.text().catch(() => undefined);
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const environmentRaw = (process.env.SQUARE_ENVIRONMENT || 'sandbox').trim().toLowerCase();
  const environment = environmentRaw === 'production' ? 'production' : 'sandbox';
  const accessToken = (process.env.SQUARE_ACCESS_TOKEN || '').trim();
  const locationId = (process.env.SQUARE_LOCATION_ID || '').trim();

  const enabled = !!accessToken;
  if (!enabled) {
    return NextResponse.json({
      success: true,
      ok: false,
      enabled: false,
      environment,
      missing: { accessToken: true, locationId: !locationId },
      message: 'Square is not configured (SQUARE_ACCESS_TOKEN missing).',
    });
  }

  const host = environment === 'production' ? 'connect.squareup.com' : 'connect.squareupsandbox.com';
  const base = `https://${host}`;
  const headers = {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
    'square-version': '2024-01-18',
  } as Record<string, string>;

  const out: any = {
    success: true,
    timestamp: new Date().toISOString(),
    enabled: true,
    environment,
    configured: {
      hasAccessToken: true,
      hasLocationId: !!locationId,
    },
    merchant: {
      ok: false,
      status: null as number | null,
      merchantId: null as string | null,
      businessName: null as string | null,
    },
    location: locationId
      ? {
          ok: false,
          status: null as number | null,
          locationId,
          name: null as string | null,
        }
      : null,
    errors: [] as string[],
  };

  // 1) Merchant identity (token validity)
  try {
    const r = await fetchJsonWithTimeout(`${base}/v2/merchants/me`, { headers }, 5000);
    out.merchant.status = r.status;
    if (r.ok) {
      out.merchant.ok = true;
      const merchant = r.json?.merchant;
      out.merchant.merchantId = typeof merchant?.id === 'string' ? merchant.id : null;
      out.merchant.businessName = typeof merchant?.business_name === 'string' ? merchant.business_name : null;
    } else {
      out.errors.push(`square:merchants/me status=${r.status}`);
    }
  } catch (e: any) {
    out.errors.push(`square:merchants/me error=${e?.name === 'AbortError' ? 'timeout' : e?.message || String(e)}`);
  }

  // 2) Location validation (optional)
  if (locationId) {
    try {
      const r = await fetchJsonWithTimeout(`${base}/v2/locations/${encodeURIComponent(locationId)}`, { headers }, 5000);
      out.location.status = r.status;
      if (r.ok) {
        out.location.ok = true;
        const loc = r.json?.location;
        out.location.name = typeof loc?.name === 'string' ? loc.name : null;
      } else {
        out.errors.push(`square:locations/${locationId} status=${r.status}`);
      }
    } catch (e: any) {
      out.errors.push(
        `square:locations/${locationId} error=${e?.name === 'AbortError' ? 'timeout' : e?.message || String(e)}`
      );
    }
  }

  out.ok = out.merchant.ok && (!locationId || out.location?.ok === true);
  return NextResponse.json(out);
}

