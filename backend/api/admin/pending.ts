import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../../src/lib/clerk";
import { isAdmin } from "../../src/lib/rbac";

/**
 * GET /api/admin/pending
 * Returns all users with status="pending" (awaiting approval).
 * Only accessible by admins.
 * 
 * Clerk Metadata: READS publicMetadata from all users
 * - Filters users where status === "pending"
 * 
 * Response: { pending: [{ userId, email, role, status }] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });
  if (!isAdmin(auth.user)) return res.status(403).json({ error: "Admin access required" });

  const list = await clerk.users.getUserList({ limit: 500 });
  const pending = list.data
    .filter((u: any) => (u.publicMetadata as any)?.status === "pending")
    .map((u: any) => ({
      userId: u.id,
      email: u.emailAddresses?.[0]?.emailAddress,
      role: (u.publicMetadata as any)?.role ?? "student",
      status: (u.publicMetadata as any)?.status ?? "active"
    }));

  res.status(200).json({ pending });
}
