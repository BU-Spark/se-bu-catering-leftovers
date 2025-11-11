// backend/api/request-role.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../src/lib/clerk";

/**
 * POST /api/request-role
 * Allows a student to request staff access.
 * 
 * Clerk Metadata: UPDATES publicMetadata
 * - Sets status to "pending" (awaiting admin approval)
 * - Role stays "student" until admin approves
 *
 * Responses:
 * 200 { ok: true, status: "pending" }
 * 400 { error: "..."} for invalid state
 * 401 { error: "..."} for auth issues
 * 409 { error: "..."} for duplicate pending
 * 500 { error: "..."} for server/Clerk errors
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) {
    return res.status(401).json({ error: auth.error });
  }

  const md = (auth.user.publicMetadata ?? {}) as Record<string, any>;
  const role = md.role as string | undefined;
  const status = md.status as string | undefined;

  // Already pending
  if (status === "pending") {
    return res.status(409).json({ error: "Role request already pending" });
  }

  // Already elevated
  if (role === "staff" || role === "admin") {
    return res.status(400).json({ error: "User already has elevated privileges" });
  }

  try {
    await clerk.users.updateUserMetadata(auth.userId, {
      publicMetadata: { ...md, status: "pending" },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update user metadata" });
  }

  return res.status(200).json({ ok: true, status: "pending" });
}
