// backend/api/request-role.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../src/lib/clerk";

/**
 * POST /api/request-role
 * Allows a student to request staff access.
 * Response: { ok: true, status: "pending" }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  const md = (auth.user.publicMetadata ?? {}) as Record<string, any>;
  await clerk.users.updateUserMetadata(auth.userId, {
    publicMetadata: { ...md, status: "pending" }
  });

  res.status(200).json({ ok: true, status: "pending" });
}
