import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Env Variables
const BASE_URL = process.env.BASE;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
const STUDENT_ID = process.env.STUDENT_ID!;
const ADMIN_ID = process.env.ADMIN_ID!;

let studentToken: string;
let adminToken: string;

/**
 * Request to Clerk API for
 * - Modifying user metadata (roles, status)
 * - Creating sessions and generating JWT tokens
 */
async function clerkApi(method: string, path: string, body?: any) {
  const res = await fetch(`https://api.clerk.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

/**
 * Create a Clerk session for a given user 
 * Then request a JWT token for that session
 */
async function makeToken(userId: string): Promise<string> {
  const session = await clerkApi('POST', '/v1/sessions', { user_id: userId });
  const token = await clerkApi('POST', `/v1/sessions/${session.id}/tokens`);
  return token.jwt;
}

/**
 * Reset public metadata to a given role + status
 * This modifies Clerk user state used for RBAC
 */
async function resetUser(userId: string, role: string, status: string) {
  await clerkApi('PATCH', `/v1/users/${userId}`, {
    public_metadata: { role, status }
  });
}

/**
 * Before all tests:
 * - Reset both users to baseline in Clerk:
 *    - Admin -> admin / active
 *    - Student -> student / active
 * - Generate new JWT tokens for both
 */
beforeAll(async () => {
  await resetUser(ADMIN_ID, 'admin', 'active');
  await resetUser(STUDENT_ID, 'student', 'active');

  studentToken = await makeToken(STUDENT_ID);
  adminToken = await makeToken(ADMIN_ID);

  // Wait for Clerk
  await new Promise(resolve => setTimeout(resolve, 1000));
}, 30000);

/**
 * After all tests:
 * - Reset student back to normal state
 */
afterAll(async () => {
  await resetUser(STUDENT_ID, 'student', 'active');
}, 15000);


// RBAC API Test Suites
describe('RBAC API Tests', () => {

  // Health Check
  describe('GET /api/ping', () => {
    it('should return ok', async () => {
      const res = await fetch(`${BASE_URL}/api/ping`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  // Authentication & Identity
  describe('GET /api/me', () => {

    it('should return 401 without auth', async () => {
      const res = await fetch(`${BASE_URL}/api/me`);
      expect(res.status).toBe(401);
    });

    it('should return RBAC info for student', async () => {
      const res = await fetch(`${BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.userId).toBe(STUDENT_ID);
      expect(data.rbac.role).toBe('student');
      expect(data.rbac.status).toBe('active');
    });

    it('should return RBAC info for admin', async () => {
      const res = await fetch(`${BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.userId).toBe(ADMIN_ID);
      expect(data.rbac.role).toBe('admin');
      expect(data.rbac.status).toBe('active');
    });
  });

  // Student Role-Request
  describe('POST /api/request-role', () => {

    it('should allow student to request staff role', async () => {
      const res = await fetch(`${BASE_URL}/api/request-role`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.status).toBe('pending');
    });

    it('should return 409 if already pending', async () => {
      const res = await fetch(`${BASE_URL}/api/request-role`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      expect(res.status).toBe(409);
    });

    it('should return 401 without auth', async () => {
      const res = await fetch(`${BASE_URL}/api/request-role`, {
        method: 'POST'
      });

      expect(res.status).toBe(401);
    });
  });

  // Pending Approvals List (Admin only)
  describe('GET /api/admin/pending', () => {

    it('should return 403 for non-admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pending`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      expect(res.status).toBe(403);
    });

    it('should return pending users for admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.pending)).toBe(true);

      const studentInList = data.pending.find((u: any) => u.userId === STUDENT_ID);
      expect(studentInList).toBeDefined();
      expect(studentInList.status).toBe('pending');
    });
  });

  // Approval
  describe('POST /api/admin/approve/:uid', () => {

    it('should return 403 for non-admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/approve/${STUDENT_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      expect(res.status).toBe(403);
    });

    it('should approve pending user', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/approve/${STUDENT_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.userId).toBe(STUDENT_ID);

      // Wait for Clerk before checking updated role
      await new Promise(resolve => setTimeout(resolve, 1000));

      const meRes = await fetch(`${BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const meData = await meRes.json();

      expect(meData.rbac.role).toBe('staff');
      expect(meData.rbac.status).toBe('active');
    });

    it('should return 400 if user is not pending anymore', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/approve/${STUDENT_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(res.status).toBe(400);
    });
  });

  // Staff Listing (Admin only)
  describe('GET /api/admin/staff', () => {

    it('should return 403 for non-admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      expect(res.status).toBe(403);
    });

    it('should return active staff for admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.staff)).toBe(true);

      const studentInList = data.staff.find((u: any) => u.userId === STUDENT_ID);
      expect(studentInList).toBeDefined();
      expect(studentInList.role).toBe('staff');
      expect(studentInList.status).toBe('active');
    });
  });

  // Revocation
  describe('POST /api/admin/revoke/:uid', () => {

    it('should return 403 for non-admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/revoke/${STUDENT_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      expect(res.status).toBe(403);
    });

    it('should prevent self-revocation for admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/revoke/${ADMIN_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(res.status).toBe(400);
    });

    it('should revoke staff privileges and restore student role', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/revoke/${STUDENT_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);

      // Wait for Clerk before checking RBAC again
      await new Promise(resolve => setTimeout(resolve, 1000));

      const meRes = await fetch(`${BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const meData = await meRes.json();

      expect(meData.rbac.role).toBe('student');
      expect(meData.rbac.status).toBe('active');
    });
  });
});
