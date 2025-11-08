export type Role = "student" | "staff" | "admin";
export type Status = "active" | "pending" | "disabled";

export interface RbacData {
  role: Role;
  status: Status;
}

/**
 * Extracts RBAC data from a Clerk user's publicMetadata.
 */
export function readRbacFromUser(user: any): RbacData {
  const md = (user.publicMetadata ?? {}) as Record<string, any>;
  return {
    role: (md.role ?? "student") as Role,
    status: (md.status ?? "active") as Status,
  };
}

/**
 * Checks if a user is an active admin.
 */
export function isAdmin(user: any): boolean {
  const { role, status } = readRbacFromUser(user);
  return role === "admin" && status === "active";
}

/**
 * Checks if a user is active staff or admin.
 */
export function isStaffOrAdmin(user: any): boolean {
  const { role, status } = readRbacFromUser(user);
  return (role === "staff" || role === "admin") && status === "active";
}
