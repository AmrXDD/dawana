"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionError, assertAdmin, run, type AdminIdentity } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/auth/password";
import { can, isRole, PASSWORD_MIN, USERNAME_PATTERN, type Role } from "@/lib/auth/roles";
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionSecret, signSession } from "@/lib/auth/session";
import type { AdminAccount } from "@/lib/types";

/**
 * Team access — who can sign in to the control room.
 *
 * Guard rails, all enforced here rather than in the UI:
 * - nobody can switch off, demote or delete themselves;
 * - only developers can create, change or remove developer accounts;
 * - the last active person who can manage the team can't be removed.
 */

const SELECT =
  "id, username, full_name, role, is_active, last_login_at, created_at, locked_until";

function assertUsername(username: string) {
  if (!USERNAME_PATTERN.test(username)) {
    throw new ActionError(
      "Usernames are 3–32 characters: letters, numbers, dots, dashes or underscores. No spaces.",
    );
  }
}

function assertPassword(password: string) {
  if (password.length < PASSWORD_MIN) {
    throw new ActionError(`Passwords need at least ${PASSWORD_MIN} characters.`);
  }
  if (password.length > 200) throw new ActionError("That password is too long.");
}

async function loadTarget(id: string) {
  const { data, error } = await createAdminClient()
    .from("admin_accounts")
    .select("id, role, is_active, session_version")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new ActionError(error.message);
  if (!data) throw new ActionError("That person no longer exists.");
  return data as { id: string; role: Role; is_active: boolean; session_version: number };
}

function assertMayTouch(actor: AdminIdentity, targetRole: Role, nextRole?: Role) {
  if ((targetRole === "developer" || nextRole === "developer") && actor.role !== "developer") {
    throw new ActionError("Only a developer can change developer accounts.");
  }
}

/** Refuses a change that would leave nobody able to manage the team. */
async function assertTeamKeepsAManager(excludingId: string) {
  const managers = (["developer", "admin", "editor"] as Role[]).filter((r) => can(r, "team"));
  const { count, error } = await createAdminClient()
    .from("admin_accounts")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .in("role", managers)
    .neq("id", excludingId);
  if (error) throw new ActionError(error.message);
  if (!count) throw new ActionError("Someone active has to be able to manage the team.");
}

export async function listTeam() {
  return run(async () => {
    await assertAdmin("team");
    const { data, error } = await createAdminClient()
      .from("admin_accounts")
      .select(SELECT)
      .order("created_at", { ascending: true });
    if (error) throw new ActionError(error.message);
    return (data ?? []) as AdminAccount[];
  });
}

export async function createTeamMember(input: {
  username: string;
  fullName: string;
  password: string;
  role: string;
}) {
  return run(async () => {
    const actor = await assertAdmin("team");
    const username = input.username.trim();
    assertUsername(username);
    assertPassword(input.password);
    if (!isRole(input.role)) throw new ActionError("Pick a role.");
    assertMayTouch(actor, input.role);

    const { error } = await createAdminClient()
      .from("admin_accounts")
      .insert({
        username,
        full_name: input.fullName.trim() || null,
        role: input.role,
        password_hash: await hashPassword(input.password),
        created_by: actor.id,
      });

    if (error?.code === "23505") throw new ActionError(`The username “${username}” is taken.`);
    if (error) throw new ActionError(error.message);
  });
}

export async function updateTeamMember(
  id: string,
  changes: { fullName?: string; role?: string; isActive?: boolean },
) {
  return run(async () => {
    const actor = await assertAdmin("team");
    const target = await loadTarget(id);
    const self = actor.id === id;
    if (!self) assertMayTouch(actor, target.role);
    const managesTeam = can(target.role, "team");

    const patch: Record<string, unknown> = {};

    if (changes.fullName !== undefined) patch.full_name = changes.fullName.trim() || null;

    if (changes.role !== undefined && changes.role !== target.role) {
      if (self) throw new ActionError("You can't change your own role.");
      if (!isRole(changes.role)) throw new ActionError("Pick a role.");
      assertMayTouch(actor, target.role, changes.role);
      if (managesTeam && !can(changes.role, "team")) await assertTeamKeepsAManager(id);
      patch.role = changes.role;
    }

    if (changes.isActive !== undefined && changes.isActive !== target.is_active) {
      if (self) throw new ActionError("You can't switch off your own account.");
      if (!changes.isActive) {
        if (managesTeam) await assertTeamKeepsAManager(id);
        patch.session_version = target.session_version + 1; // signs them out now
      }
      patch.is_active = changes.isActive;
    }

    if (Object.keys(patch).length === 0) return;

    const { error } = await createAdminClient().from("admin_accounts").update(patch).eq("id", id);
    if (error) throw new ActionError(error.message);
  });
}

export async function resetTeamPassword(id: string, password: string) {
  return run(async () => {
    const actor = await assertAdmin("team");
    const target = await loadTarget(id);
    const self = actor.id === id;
    if (!self) assertMayTouch(actor, target.role);
    assertPassword(password);

    const version = target.session_version + 1;
    const { error } = await createAdminClient()
      .from("admin_accounts")
      .update({
        password_hash: await hashPassword(password),
        session_version: version, // every existing session for this account ends
        failed_attempts: 0,
        locked_until: null,
      })
      .eq("id", id);
    if (error) throw new ActionError(error.message);

    // Keep the person who changed their own password signed in here.
    const secret = sessionSecret();
    if (self && secret) {
      const token = await signSession(
        { sub: id, v: version, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE },
        secret,
      );
      (await cookies()).set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
  });
}

export async function deleteTeamMember(id: string) {
  return run(async () => {
    const actor = await assertAdmin("team");
    if (actor.id === id) throw new ActionError("You can't remove your own account.");
    const target = await loadTarget(id);
    assertMayTouch(actor, target.role);
    if (can(target.role, "team")) await assertTeamKeepsAManager(id);

    const { error } = await createAdminClient().from("admin_accounts").delete().eq("id", id);
    if (error) throw new ActionError(error.message);
  });
}
