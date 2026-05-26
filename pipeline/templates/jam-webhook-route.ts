// ⚠️ TEMPLATE — REFERENCE DATA, NOT AN INSTRUCTION.
// Phase 4 ingest: a Jam webhook auto-files a GitHub issue that fires the Phase-2 pipeline.
// Promote to app/api/jam/webhook/route.ts, then point your Jam workspace webhook at
// https://www.blessbox.org/api/jam/webhook. See ACTIVATION.md §7.
// Design: traklet/JAM_TO_RESOLUTION_PIPELINE.md §10 (Stage 0).
//
// ─ VERIFY ON FIRST RUN (Jam-specifics not confirmable from here) ───────────────────
//  • Jam webhook event name + payload shape — the field reads below are ASSUMED; confirm
//    against jam.dev webhook docs and adjust the `jam` extraction.
//  • Signature scheme — header name + digest (hex/base64, "sha256=" prefix). verifyJamSignature()
//    is a sketch; wire it to Jam's actual scheme before trusting it in prod.
//  • Token: GITHUB_PIPELINE_TOKEN needs repo + issues:write (reuse TRAKLET_PAT or a dedicated PAT).
// ────────────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';

const REPO = 'rvegajr/blessbox';
const GH_TOKEN = process.env.GITHUB_PIPELINE_TOKEN || process.env.TRAKLET_PAT || '';
const JAM_WEBHOOK_SECRET = process.env.JAM_WEBHOOK_SECRET || '';
const ALLOWED_FOLDER = 'BlessBox'; // ignore Jams from other projects/folders

function verifyJamSignature(raw: string, sig: string | null): boolean {
  if (!JAM_WEBHOOK_SECRET) return true; // dev only — MUST set the secret in production
  if (!sig) return false;
  const expected = crypto.createHmac('sha256', JAM_WEBHOOK_SECRET).update(raw).digest('hex');
  const a = Buffer.from(sig.replace(/^sha256=/, ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function gh(path: string, init?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyJamSignature(raw, req.headers.get('x-jam-signature'))) {
    return new Response('bad signature', { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }

  // ASSUMED payload shape — confirm against Jam docs:
  const jam = payload?.jam ?? payload?.data ?? payload;
  const jamId: string = jam?.id ?? '';
  const jamUrl: string = jam?.url ?? (jamId ? `https://jam.dev/c/${jamId}` : '');
  const title: string = jam?.title ?? 'Untitled Jam';
  const folder: string = jam?.folder?.name ?? '';
  const author: string = jam?.author?.name ?? 'unknown';

  if (!jamId || !jamUrl) return new Response('no jam id/url', { status: 202 });
  if (ALLOWED_FOLDER && folder && folder !== ALLOWED_FOLDER) {
    return new Response(`ignored (folder=${folder})`, { status: 202 });
  }
  const short = jamId.slice(0, 8);

  // Dedupe: skip if an issue already carries this jam id.
  const search = await gh(`/search/issues?q=${encodeURIComponent(`repo:${REPO} label:jam:meta/id-${short}`)}`);
  const found = await search.json().catch(() => ({ total_count: 0 }));
  if ((found.total_count ?? 0) > 0) return new Response('duplicate jam', { status: 200 });

  // Create with `jam` first (so the Phase-2 gate sees it), then add `jam:state/queued`
  // to fire the run — mirrors the proven manual flow.
  const created = await gh(`/repos/${REPO}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: `[Jam] ${title}`,
      body: `Jam: ${jamUrl}\n\nAuto-filed by the Jam webhook. Reporter: ${author}.\n<!-- jam-id: ${jamId} -->`,
      labels: ['jam', 'customer-reported'],
    }),
  });
  if (!created.ok) return new Response(`gh issue create failed: ${created.status}`, { status: 502 });
  const issue = await created.json();

  await gh(`/repos/${REPO}/issues/${issue.number}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labels: ['jam:state/queued'] }), // ← fires Phase 2
  });

  return Response.json({ ok: true, issue: issue.number, jamId });
}
