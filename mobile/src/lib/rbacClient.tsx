// src/lib/rbacClient.ts
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

export type Role = 'student' | 'staff' | 'admin';
export type Status = 'active' | 'pending' | 'disabled' | string;

export interface RbacData {
  role: Role;
  status: Status;
}

export interface MeResponse {
  userId: string;
  rbac: RbacData | null;
}

export interface RbacUser {
  userId: string;
  email?: string;
  role: Role;
  status: Status;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!API_BASE_URL) {
  console.warn(
    '[rbacClient] EXPO_PUBLIC_BACKEND_URL is not set. RBAC calls will fail.',
  );
}

/**
 * Low-level helper to call Vercel backend with a Clerk Bearer token.
 */
async function backendFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not set');
  }

  const token = await getToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let json: any = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // ignore parse error; fall back to generic error if needed
    }
  }

  if (!res.ok) {
    const message =
      (json && typeof json.error === 'string' && json.error) ||
      res.statusText ||
      'Request failed';
    throw new Error(message);
  }

  return json as T;
}

/**
 * GET /api/me
 * Returns { userId, rbac: { role, status } }
 */
export async function fetchMe(getToken: () => Promise<string | null>) {
  return backendFetch<MeResponse>('/api/me', getToken);
}

/**
 * POST /api/request-role
 * Allows a student to request staff access.
 * Returns { ok: true, status: "pending" }
 */
export async function requestStaffRole(getToken: () => Promise<string | null>) {
  return backendFetch<{ ok: boolean; status: Status }>(
    '/api/request-role',
    getToken,
    { method: 'POST' },
  );
}

/**
 * GET /api/admin/pending
 * Returns { pending: RbacUser[] }
 */
export async function fetchPendingStaff(
  getToken: () => Promise<string | null>,
) {
  return backendFetch<{ pending: RbacUser[] }>('/api/admin/pending', getToken);
}

/**
 * GET /api/admin/staff
 * Returns { staff: RbacUser[] } (active staff)
 */
export async function fetchActiveStaff(getToken: () => Promise<string | null>) {
  return backendFetch<{ staff: RbacUser[] }>('/api/admin/staff', getToken);
}

/**
 * POST /api/admin/approve/[uid]
 * Approves a user's staff request (role: "staff", status: "active").
 */
export async function approveStaff(
  uid: string,
  getToken: () => Promise<string | null>,
) {
  if (!uid) throw new Error('Missing user id');
  return backendFetch<{ ok: boolean; userId: string }>(
    `/api/admin/approve/${uid}`,
    getToken,
    { method: 'POST' },
  );
}

/**
 * POST /api/admin/revoke/[uid]
 * Demotes a user back to student (role: "student", status: "active").
 * Works for both pending (reject) and active staff (revoke).
 */
export async function revokeStaff(
  uid: string,
  getToken: () => Promise<string | null>,
) {
  if (!uid) throw new Error('Missing user id');
  return backendFetch<{ ok: boolean; userId: string }>(
    `/api/admin/revoke/${uid}`,
    getToken,
    { method: 'POST' },
  );
}

// Shared RBAC state
let rbacData: RbacData | null = null;
let rbacUserId: string | null = null;
let rbacLoading = false;
let rbacError: string | null = null;
let inFlightPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.error('[rbacClient] listener error', err);
    }
  }
}

async function fetchRbacInternal(
  getToken: () => Promise<string | null>,
  force = false,
): Promise<void> {
  // Reuse in-flight request if not forcing
  if (inFlightPromise && !force) {
    return inFlightPromise;
  }

  rbacLoading = true;
  rbacError = null;
  notifyListeners();

  inFlightPromise = (async () => {
    try {
      const res = await backendFetch<MeResponse>('/api/me', getToken);
      rbacUserId = res.userId ?? null;
      rbacData = res.rbac ?? null;
    } catch (err: any) {
      console.error('[rbacClient] Failed to load RBAC info:', err);
      rbacError = err?.message || 'Failed to load RBAC info';
      rbacUserId = null;
      rbacData = null;
    } finally {
      rbacLoading = false;
      inFlightPromise = null;
      notifyListeners();
    }
  })();

  return inFlightPromise;
}

/**
 * Hook: useRbac
 * - All components share the same RBAC data.
 * - Only one /api/me request is made per app session unless refresh() is called.
 */
export function useRbac() {
  const { isSignedIn, getToken } = useAuth();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => {
      setVersion((v) => v + 1);
    };

    listeners.add(listener);

    // Always (re)load once per signed-in session, even if rbacData is already set
    if (isSignedIn && !rbacLoading) {
      fetchRbacInternal(getToken, true);
    }

    // Clear stale cache on sign-out so a future sign-in doesn't reuse it
    if (!isSignedIn) {
      rbacData = null;
      rbacUserId = null;
      rbacError = null;
      rbacLoading = false;
      inFlightPromise = null;
    }

    return () => {
      listeners.delete(listener);
    };
  }, [isSignedIn, getToken]);

  const refresh = useCallback(() => {
    if (!isSignedIn) return;
    fetchRbacInternal(getToken, true);
  }, [isSignedIn, getToken]);

  if (!isSignedIn) {
    return {
      loading: false,
      error: null as string | null,
      userId: null as string | null,
      rbac: null as RbacData | null,
      refresh,
    };
  }

  const loading = rbacLoading || (!rbacData && !rbacError);

  return {
    loading,
    error: rbacError,
    userId: rbacUserId,
    rbac: rbacData,
    refresh,
  };
}
