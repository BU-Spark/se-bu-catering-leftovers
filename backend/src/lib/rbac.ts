export type Role = "student" | "staff" | "admin";
export type Status = "active" | "pending" | "disabled";

export function readRbacFromUser(user: any) {
  const md = (user.publicMetadata ?? {}) as Record<string, any>;
  return {
    role: (md.role ?? "student") as Role,
    status: (md.status ?? "active") as Status,
    requestedRole: (md.requestedRole ?? null) as Role | null,
  };
}

export function isAdmin(user: any) {
  const { role, status } = readRbacFromUser(user);
  return role === "admin" && status === "active";
}
