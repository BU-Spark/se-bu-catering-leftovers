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

let API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Fallback for iOS Expo Go env var loading issues
if (!API_BASE_URL) {
  API_BASE_URL =
    'https://freebites-backend-2a41n9xzn-andrewx-bus-projects.vercel.app';
  console.warn(
    '[rbacClient] ⚠️  EXPO_PUBLIC_BACKEND_URL not found, using hardcoded fallback',
  );
}

const DEBUG = true; // Toggle for debugging

const log = (tag: string, msg: string, data?: any) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [${tag}] ${msg}`, data);
    } else {
      console.log(`[${timestamp}] [${tag}] ${msg}`);
    }
  }
};

console.log('[rbacClient] API_BASE_URL:', API_BASE_URL);

/**
 * Low-level helper to call Vercel backend with a Clerk Bearer token.
 */
async function backendFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init: RequestInit = {},
): Promise<T> {
  log('backendFetch', `Starting fetch: ${path}`);

  if (!API_BASE_URL) {
    log('backendFetch', '❌ EXPO_PUBLIC_BACKEND_URL is not set');
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not set');
  }

  try {
    log('backendFetch', 'Getting auth token...');
    const token = await getToken();
    log('backendFetch', `Token received: ${token ? 'Yes' : 'No'}`);

    if (!token) {
      log('backendFetch', '❌ Missing auth token');
      throw new Error('Missing auth token');
    }

    const url = `${API_BASE_URL}${path}`;
    log('backendFetch', `Fetching from: ${url}`);

    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    log('backendFetch', `Response status: ${res.status}`);

    const text = await res.text();
    let json: any = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        log('backendFetch', '⚠️  Failed to parse response JSON');
      }
    }

    if (!res.ok) {
      const message =
        (json && typeof json.error === 'string' && json.error) ||
        res.statusText ||
        'Request failed';
      log('backendFetch', `❌ Request failed: ${message}`);
      throw new Error(message);
    }

    log('backendFetch', `✅ Success: ${path}`, json);
    return json as T;
  } catch (err) {
    log('backendFetch', `❌ Exception in backendFetch`, err);
    throw err;
  }
}

/**
 * GET /api/me
 * Returns { userId, rbac: { role, status } }
 */
export async function fetchMe(getToken: () => Promise<string | null>) {
  log('fetchMe', 'Starting fetchMe');
  return backendFetch<MeResponse>('/api/me', getToken);
}

/**
 * POST /api/request-role
 * Allows a student to request staff access.
 * Returns { ok: true, status: "pending" }
 */
export async function requestStaffRole(getToken: () => Promise<string | null>) {
  log('requestStaffRole', 'Starting requestStaffRole');
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
  log('fetchPendingStaff', 'Starting fetchPendingStaff');
  return backendFetch<{ pending: RbacUser[] }>('/api/admin/pending', getToken);
}

/**
 * GET /api/admin/staff
 * Returns { staff: RbacUser[] } (active staff)
 */
export async function fetchActiveStaff(getToken: () => Promise<string | null>) {
  log('fetchActiveStaff', 'Starting fetchActiveStaff');
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
  log('approveStaff', `Approving staff: ${uid}`);
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
  log('revokeStaff', `Revoking staff: ${uid}`);
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
  log('rbacClient', `Notifying ${listeners.size} listeners`);
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
  log('fetchRbacInternal', `Called with force=${force}`, {
    inFlightPromise: !!inFlightPromise,
    rbacLoading,
  });

  // Reuse in-flight request if not forcing
  if (inFlightPromise && !force) {
    log('fetchRbacInternal', 'Reusing in-flight promise');
    return inFlightPromise;
  }

  rbacLoading = true;
  rbacError = null;
  notifyListeners();

  inFlightPromise = (async () => {
    try {
      log('fetchRbacInternal', 'Calling backendFetch...');
      const res = await backendFetch<MeResponse>('/api/me', getToken);
      rbacUserId = res.userId ?? null;
      rbacData = res.rbac ?? null;
      log('fetchRbacInternal', '✅ RBAC data loaded', {
        userId: rbacUserId,
        role: rbacData?.role,
      });
    } catch (err: any) {
      console.error('[rbacClient] Failed to load RBAC info:', err);
      rbacError = err?.message || 'Failed to load RBAC info';
      rbacUserId = null;
      rbacData = null;
      log('fetchRbacInternal', `❌ Error: ${rbacError}`);
    } finally {
      rbacLoading = false;
      inFlightPromise = null;
      notifyListeners();
      log('fetchRbacInternal', 'fetchRbacInternal complete');
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

  log('useRbac', 'Hook rendered', { isSignedIn });

  useEffect(() => {
    log('useRbac', 'useEffect triggered', { isSignedIn, rbacLoading });

    const listener = () => {
      log('useRbac', 'State changed, re-rendering');
      setVersion((v) => v + 1);
    };

    listeners.add(listener);

    // Always (re)load once per signed-in session
    if (isSignedIn && !rbacLoading) {
      log('useRbac', 'Initiating fetchRbacInternal...');
      fetchRbacInternal(getToken, true);
    }

    // Clear stale cache on sign-out
    if (!isSignedIn) {
      log('useRbac', 'Clearing RBAC cache (signed out)');
      rbacData = null;
      rbacUserId = null;
      rbacError = null;
      rbacLoading = false;
      inFlightPromise = null;
    }

    return () => {
      log('useRbac', 'Cleanup: removing listener');
      listeners.delete(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const refresh = useCallback(() => {
    log('useRbac', 'refresh() called', { isSignedIn });
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
  log('useRbac', 'Returning state', {
    loading,
    error: rbacError,
    role: rbacData?.role,
  });

  return {
    loading,
    error: rbacError,
    userId: rbacUserId,
    rbac: rbacData,
    refresh,
  };
}
