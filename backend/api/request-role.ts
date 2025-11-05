// backend/api/request-role.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../src/lib/clerk";

/**
 * Allows an authenticated user to request a new role ("staff").
 *
 * @param req - VercelRequest object containing method, headers, and body data.
 * @param res - VercelResponse object used to send back JSON responses.
 * @returns Responds with JSON:
 *  - On success: { ok: true, requestedRole, status: "pending" }
 *  - On failure: { error: string }
 *
 * Requirements:
 *  - Method: POST
 *  - Body must include `requestedRole` ("student" or "staff").
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const requestedRole = body?.requestedRole as "student" | "staff" | undefined;
  if (!requestedRole) return res.status(400).json({ error: "requestedRole required" });

  const md = (auth.user.publicMetadata ?? {}) as Record<string, any>;
  await clerk.users.updateUserMetadata(auth.userId, {
    publicMetadata: { ...md, requestedRole, status: "pending" }
  });

  res.status(200).json({ ok: true, requestedRole, status: "pending" });
}
