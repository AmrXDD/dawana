import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, isAdminDataConfigured } from "@/lib/supabase/server";
import { can, isRole, type Permission, type Role } from "@/lib/auth/roles";
import { SESSION_COOKIE, sessionSecret, verifySession } from "@/lib/auth/session";

export interface AdminIdentity {
  id: string;
  username: string;
  fullName: string | null;
  role: Role;
}

/** Everything needed before anyone can sign in at all. */
export function isAdminAuthConfigured() {
  return isAdminDataConfigured() && sessionSecret() !== null;
}

/**
 * The signed-in admin for this request, or null.
 *
 * The cookie signature alone isn't trusted for access: the account is looked
 * up on every request, so disabling someone, changing their role or resetting
 * their password takes effect on their very next click. Cached per request.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const secret = sessionSecret();
  if (!secret || !isAdminDataConfigured()) return null;

  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value, secret);
  if (!session) return null;

  const { data, error } = await createAdminClient()
    .from("admin_accounts")
    .select("id, username, full_name, role, is_active, session_version")
    .eq("id", session.sub)
    .maybeSingle();

  if (error || !data || !data.is_active || data.session_version !== session.v) return null;
  if (!isRole(data.role)) return null;

  return { id: data.id, username: data.username, fullName: data.full_name, role: data.role };
});

/** For pages: sends anyone without a session to sign-in, and anyone without the permission home. */
export async function requireAdmin(permission?: Permission) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !can(admin.role, permission)) redirect("/admin");
  return admin;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export class ActionError extends Error {}

/** For server actions: throws an ActionError instead of redirecting. */
export async function assertAdmin(permission?: Permission) {
  if (!isAdminAuthConfigured()) throw new ActionError("The database isn't connected yet.");
  const admin = await getCurrentAdmin();
  if (!admin) throw new ActionError("Your session has ended. Please sign in again.");
  if (permission && !can(admin.role, permission)) {
    throw new ActionError("Your role doesn't allow this.");
  }
  return admin;
}

/** Wraps an action body so every failure comes back as a readable message. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
