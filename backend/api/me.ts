// backend/api/me.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders } from "../src/lib/clerk";
import { readRbacFromUser } from "../src/lib/rbac";

/**
 * Retrieves information about the currently authenticated user.
 *
 * @param req - VercelRequest object containing the authorization headers.
 * @param res - VercelResponse object used to send back JSON responses.
 * @returns Responds with JSON:
 *  - On success: { userId, rbac }
 *  - On failure: { error: string }
 *
 * Requirements:
 *  - User must provide a valid Clerk session token in the Authorization header.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  const rbac = readRbacFromUser(auth.user);
  res.status(200).json({ userId: auth.userId, rbac });
}
