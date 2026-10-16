import { CONFIG } from '../config';
import { db } from './db';

export interface LocalSession {
  key: 'profile';
  email: string;
  displayName: string;
  picture?: string;
  provider: string;
  exp: number;
}

export async function getProviders(appId = CONFIG.appId): Promise<string[]> {
  const r = await fetch(`${CONFIG.apiBaseUrl}/auth/providers/${appId}`);
  if (r.status === 204) return [];
  if (!r.ok) throw new Error('providers-fail');
  const j = await r.json();
  // Supports {data:[...]} or [...]
  const arr = Array.isArray(j) ? j : j.data ?? [];
  return arr.map((p: any) => p.id ?? p.providerId ?? p).filter(Boolean);
}

export async function startLogin(providerId: string, appId = CONFIG.appId): Promise<void> {
  const r = await fetch(`${CONFIG.apiBaseUrl}/auth/login/${appId}/${providerId}`, { method: 'POST' });
  if (!r.ok) throw new Error('login-fail');
  const j = await r.json();
  const url = j.data?.redirect ?? j.redirect;
  if (!url) throw new Error('no-redirect');
  location.href = url;
}

export function readCallbackToken(): string | null {
  const h = location.hash;
  const m = h.match(/session_token=([^&]+)/);
  if (!m) return null;
  history.replaceState(null, '', location.pathname + location.search);
  return decodeURIComponent(m[1]);
}

export async function exchangeSession(token: string) {
  const r = await fetch(`${CONFIG.apiBaseUrl}/auth/session/${token}`);
  if (r.status === 404) throw new Error('session-expired');
  if (!r.ok) throw new Error('session-fail');
  const j = await r.json();
  const d = j.data ?? j;
  if (d.allowed !== true) throw new Error('not-allowed');
  const exp = Date.now() + CONFIG.sessionMaxDays * 86400_000;
  const profile: LocalSession = {
    key: 'profile',
    email: d.email,
    displayName: d.displayName ?? d.email,
    picture: d.picture,
    provider: d.provider ?? 'google',
    exp,
  };
  (await db()).put('session', profile);
  return profile;
}

export async function getSession(): Promise<LocalSession | null> {
  const s = await (await db()).get('session', 'profile') as LocalSession | undefined;
  if (!s) return null;
  if (Date.now() > s.exp) {
    await logout();
    return null;
  }
  return s;
}

export async function logout(): Promise<void> {
  await (await db()).delete('session', 'profile');
}
