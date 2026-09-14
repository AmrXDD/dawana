"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdminAuthConfigured, type ActionResult } from "@/lib/auth/admin";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionSecret, signSession } from "@/lib/auth/session";

/** Wrong passwords allowed before an account pauses, and for how long. */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const GENERIC = "That username and password don't match.";

export async function signIn(input: {
  username: string;
  password: string;
}): Promise<ActionResult> {
  const secret = sessionSecret();
  if (!isAdminAuthConfigured() || !secret) {
    return { ok: false, error: "Sign-in isn't set up yet. Add the database environment variables." };
  }

  const username = String(input.username ?? "").trim();
  const password = String(input.password ?? "");
  if (!username || !password) return { ok: false, error: "Enter your username and password." };

  const db = createAdminClient();
  const { data: account, error } = await db
    .from("admin_accounts")
    .select("id, password_hash, is_active, session_version, failed_attempts, locked_until")
    .eq("username_key", username.toLowerCase())
    .maybeSingle();

  if (error) return { ok: false, error: "Couldn't reach the database. Try again in a moment." };

  if (account?.locked_until && new Date(account.locked_until) > new Date()) {
    const minutes = Math.ceil((+new Date(account.locked_until) - Date.now()) / 60_000);
    return {
      ok: false,
      error: `Too many attempts. This account is paused for ${minutes} more minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const valid = await verifyPassword(password, account?.password_hash);

  if (!account || !valid) {
    if (account) {
      const attempts = (account.failed_attempts ?? 0) + 1;
      await db
        .from("admin_accounts")
        .update(
          attempts >= MAX_ATTEMPTS
            ? {
                failed_attempts: 0,
                locked_until: new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString(),
              }
            : { failed_attempts: attempts },
        )
        .eq("id", account.id);
    }
    return { ok: false, error: GENERIC };
  }

  if (!account.is_active) {
    return { ok: false, error: "This account has been switched off. Ask an administrator." };
  }

  await db
    .from("admin_accounts")
    .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq("id", account.id);

  const token = await signSession(
    {
      sub: account.id,
      v: account.session_version,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    },
    secret,
  );

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { ok: true, data: undefined };
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
