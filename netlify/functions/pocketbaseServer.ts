// Server-side PocketBase writer for funnel leads. Ported from mjw-roast-my-site's
// pocketbaseServer, with two differences:
//   1. Defaults to the ImmersiveKit instance (this is a funnel INTO ImmersiveKit).
//   2. Supports superuser email/password auth in addition to a static token, so lead
//      capture keeps working after a superuser token expires (tokens are short-lived).
//
// Config (set in the Netlify site env): either PB_SUPERUSER_TOKEN, or both
// PB_SUPERUSER_EMAIL + PB_SUPERUSER_PASSWORD. Without either, writes are skipped and the
// function returns a graceful "not configured" response — the scorecard still works.

const DEFAULT_POCKETBASE_URL = 'https://immersive-kit.pockethost.io';

export interface PocketBaseCreateResult {
  id: string;
}

export function getPocketBaseUrl(): string {
  return (process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || DEFAULT_POCKETBASE_URL).replace(/\/+$/, '');
}

export function hasPocketBaseWriteConfig(): boolean {
  const hasToken = Boolean(process.env.PB_SUPERUSER_TOKEN);
  const hasCreds = Boolean(process.env.PB_SUPERUSER_EMAIL && process.env.PB_SUPERUSER_PASSWORD);
  return Boolean(getPocketBaseUrl() && (hasToken || hasCreds));
}

/** Resolve a superuser bearer token: prefer a static token, else authenticate with email/password. */
async function getAuthToken(): Promise<string> {
  if (process.env.PB_SUPERUSER_TOKEN) return process.env.PB_SUPERUSER_TOKEN;

  const email = process.env.PB_SUPERUSER_EMAIL;
  const password = process.env.PB_SUPERUSER_PASSWORD;
  if (!email || !password) {
    throw new Error('PocketBase write is not configured (need PB_SUPERUSER_TOKEN or PB_SUPERUSER_EMAIL/PASSWORD).');
  }

  const res = await fetch(`${getPocketBaseUrl()}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PocketBase superuser auth failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json() as { token?: unknown };
  if (typeof data.token !== 'string' || !data.token) {
    throw new Error('PocketBase superuser auth did not return a token.');
  }
  return data.token;
}

export async function createPocketBaseRecord<T extends Record<string, unknown>>(
  collection: string,
  payload: T,
): Promise<PocketBaseCreateResult> {
  const token = await getAuthToken();

  const res = await fetch(`${getPocketBaseUrl()}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PocketBase ${collection} write failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = await res.json() as { id?: unknown };
  if (typeof data.id !== 'string' || !data.id) {
    throw new Error(`PocketBase ${collection} write did not return a record id.`);
  }

  return { id: data.id };
}

export function getRequestIp(headers: Record<string, string | undefined>): string | undefined {
  const forwardedFor = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  const clientIp = headers['client-ip'] || headers['Client-Ip'];
  const raw = forwardedFor || clientIp;
  if (!raw) return undefined;
  return raw.split(',')[0]?.trim() || undefined;
}

export async function hashRequestIdentifier(value: string | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  const encoder = new TextEncoder();
  const salt = process.env.IP_HASH_SALT || 'scorecard-default-salt';
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${value}`));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function getUserAgent(headers: Record<string, string | undefined>): string | undefined {
  const userAgent = headers['user-agent'] || headers['User-Agent'];
  return userAgent ? userAgent.slice(0, 500) : undefined;
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeTextField(value: unknown, maxLength = 240): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}
