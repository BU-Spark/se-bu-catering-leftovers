// backend/api/admin/revoke/[uid].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../../../src/lib/clerk";
import { isAdmin } from "../../../src/lib/rbac";

/**
 * POST /api/admin/revoke/[uid]
 * Revokes a user's staff access, demoting them back to student.
 * Only accessible by admins.
 * Response: { ok: true, userId }
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
    publicMetadata: { ...md, role: "student", status: "active" }
  });

  res.status(200).json({ ok: true, userId: uid });
}
