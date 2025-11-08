import { createClerkClient, verifyToken } from "@clerk/backend";

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
});

/**
 * Extracts and verifies a Clerk user from HTTP request headers.
 * Returns the authenticated user object and userId.
 */
export async function requireUserFromHeaders(headers: Record<string, string | string[] | undefined>) {
  const auth = (headers["authorization"] || headers["Authorization"]) as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return { ok: false as const, error: "Missing Bearer token" };

  try {
    const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    if (!session?.sub) return { ok: false as const, error: "Invalid session" };
    const user = await clerk.users.getUser(session.sub);
    return { ok: true as const, user, userId: session.sub };
  } catch {
    return { ok: false as const, error: "Token verification failed" };
  }
}
