import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

const USERS_KEY = 'edubrain.local.users';
const SESSION_KEY = 'edubrain.local.session';

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
};

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`edubrain:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toSession(user: StoredUser): Session {
  const authUser = {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: { display_name: user.name },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;

  return {
    access_token: `local.${user.id}`,
    refresh_token: `local.${user.id}`,
    expires_in: 60 * 60 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    token_type: 'bearer',
    user: authUser,
  };
}

export function isLocalSession(session: Session | null | undefined): boolean {
  return Boolean(session?.access_token?.startsWith('local.'));
}

export function readLocalSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function localProfile(session: Session): Profile {
  const name =
    (session.user.user_metadata?.display_name as string | undefined) ||
    session.user.email?.split('@')[0] ||
    'Learner';
  const now = new Date().toISOString();
  return {
    id: session.user.id,
    display_name: name,
    role: 'student',
    preferred_language: 'en',
    ui_language: 'en',
    voice_settings: null,
    avatar_url: null,
    created_at: now,
    updated_at: now,
  };
}

function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signUpLocal(email: string, password: string): Promise<Session> {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  if (users.some((u) => u.email === normalized)) {
    throw new Error('An account with that email already exists on this device.');
  }
  const user: StoredUser = {
    id: `local_${crypto.randomUUID()}`,
    email: normalized,
    passwordHash: await hashPassword(password),
    name: normalized.split('@')[0] || 'Learner',
  };
  writeUsers([...users, user]);
  const session = toSession(user);
  saveSession(session);
  return session;
}

export async function signInLocal(email: string, password: string): Promise<Session> {
  const normalized = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === normalized);
  const hash = await hashPassword(password);
  if (!user || user.passwordHash !== hash) {
    throw new Error('No matching account on this device. Create one with Sign up.');
  }
  const session = toSession(user);
  saveSession(session);
  return session;
}

export function isUnreachable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /failed to fetch|network|load failed|fetch|timeout/i.test(msg);
}
