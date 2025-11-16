// backend/api/admin/staff.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUserFromHeaders, clerk } from "../../src/lib/clerk";
import { isAdmin } from "../../src/lib/rbac";

/**
 * GET /api/admin/staff
 * Returns all users with role="staff" and status="active".
 * Only accessible by admins.
 *
 * Response: { staff: [{ userId, email, role, status }] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireUserFromHeaders(req.headers as Record<string, string | string[] | undefined>);
  if (!auth.ok) {
    return res.status(401).json({ error: auth.error });
  }

  if (!isAdmin(auth.user)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  let list: any;
  try {
    list = await clerk.users.getUserList({ limit: 100 });
  } catch (error) {
    console.error("Failed to fetch staff list:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }

  const staff = list.data
    .filter((u: any) => {
      const md = (u.publicMetadata ?? {}) as Record<string, any>;
      return md.role === "staff" && md.status === "active";
    })
    .map((u: any) => {
      const md = (u.publicMetadata ?? {}) as Record<string, any>;
      return {
        userId: u.id,
        email: u.emailAddresses?.[0]?.emailAddress,
        role: (md.role as string) ?? "staff",
        status: (md.status as string) ?? "active",
      };
    });

  res.status(200).json({ staff });
}
