// backend/api/admin/approve/[uid].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../../../src/lib/clerk";
import { isAdmin } from "../../../src/lib/rbac";

/**
 * Approves a pending user by updating their Clerk metadata.
 *
 * @param req - VercelRequest object containing method, headers, and query parameters.
 * @param res - VercelResponse object used to send back JSON responses.
 * @returns Responds with JSON:
 *  - On success: { ok: true, userId }
 *  - On failure: { error: string }
 *
 * Requirements:
 *  - Method: POST
 *  - User must be authenticated and have admin privileges.
 *  - Query parameter `uid` (target user ID) must be provided.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });
  if (!isAdmin(auth.user)) return res.status(403).json({ error: "Admin access required" });

  const uid = req.query.uid as string | undefined;
  if (!uid) return res.status(400).json({ error: "uid missing" });

  const target = await clerk.users.getUser(uid);
  const md = (target.publicMetadata ?? {}) as Record<string, any>;

  await clerk.users.updateUserMetadata(uid, {
    publicMetadata: { ...md, role: "staff", status: "active", requestedRole: null }
  });

  res.status(200).json({ ok: true, userId: uid });
}
