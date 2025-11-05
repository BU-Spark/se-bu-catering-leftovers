import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../../src/lib/clerk";
import { isAdmin } from "../../src/lib/rbac";

/**
 * Retrieves a list of users whose account status is pending approval.
 *
 * @param req - VercelRequest object containing authentication headers.
 * @param res - VercelResponse object used to send back JSON responses.
 * @returns Responds with JSON:
 *  - On success: { pending: Array<{ userId, email, role, requestedRole, status }> }
 *  - On failure: { error: string }
 *
 * Requirements:
 *  - User must be authenticated and have admin privileges.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireUserFromHeaders(req.headers as any);
  if (!auth.ok) return res.status(401).json({ error: auth.error });
  if (!isAdmin(auth.user)) return res.status(403).json({ error: "Admin access required" });

  const list = await clerk.users.getUserList({ limit: 100 }); // PaginatedResourceResponse<User[]>
  const pending = list.data
    .filter((u: any) => (u.publicMetadata as any)?.status === "pending")
    .map((u: any) => ({
      userId: u.id,
      email: u.emailAddresses?.[0]?.emailAddress,
      role: (u.publicMetadata as any)?.role ?? null,
      requestedRole: (u.publicMetadata as any)?.requestedRole ?? null,
      status: (u.publicMetadata as any)?.status ?? null
    }));

  res.status(200).json({ pending });
}
