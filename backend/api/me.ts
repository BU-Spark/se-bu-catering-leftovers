// backend/api/me.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders } from "../src/lib/clerk";
import { readRbacFromUser } from "../src/lib/rbac";

/**
 * GET /api/me
 * Returns information about the currently authenticated user.
 * Response: { userId, rbac: { role, status } }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  const rbac = readRbacFromUser(auth.user);
  res.status(200).json({ userId: auth.userId, rbac });
}
