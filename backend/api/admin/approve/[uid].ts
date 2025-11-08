// backend/api/admin/approve/[uid].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../../../src/lib/clerk";
import { isAdmin } from "../../../src/lib/rbac";

/**
 * POST /api/admin/approve/[uid]
 * Approves a pending user, promoting them to staff.
 * Only accessible by admins.
 * 
 * Clerk Metadata: UPDATES publicMetadata of target user
 * - Sets role to "staff" (promoted)
 * - Sets status to "active" (approved)
 * 
 * Response: { ok: true, userId }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });
  if (!isAdmin(auth.user)) return res.status(403).json({ error: "Admin access required" });

  const uid = req.query.uid as string | undefined;
  if (!uid) return res.status(400).json({ error: "uid missing" });

  let target;
  try {
    target = await clerk.users.getUser(uid);
  } catch (error) {
    return res.status(404).json({ error: "User not found" });
  }

  const md = (target.publicMetadata ?? {}) as Record<string, any>;

  // Validate user is actually pending approval
  if (md.status !== "pending") {
    return res.status(400).json({ 
      error: "User is not pending approval",
      currentStatus: md.status ?? "active"
    });
  }

  try {
    await clerk.users.updateUserMetadata(uid, {
      publicMetadata: { ...md, role: "staff", status: "active" }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update user metadata" });
  }

  res.status(200).json({ ok: true, userId: uid });
}
