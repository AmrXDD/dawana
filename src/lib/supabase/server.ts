import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Two server-side clients, no browser client.
 *
 * - `createPublicClient` uses the anon/publishable key. RLS limits it to
 *   published catalogue rows, which is all the public site ever reads.
 * - `createAdminClient` uses the service-role/secret key and bypasses RLS.
 *   Only server actions and routes that have already checked the admin
 *   session may use it.
 *
 * Neither touches cookies, so public pages stay statically renderable.
 */

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function createPublicClient() {
  if (!publicClient) {
    publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      noSession,
    );
  }
  return publicClient;
}

/** Service-role client. Server-only: never import this into a client component. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!adminClient) {
    adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, noSession);
  }
  return adminClient;
}

/** Public reads are possible (URL + anon key present). */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Admin reads and writes are possible (URL + service-role key present). */
export function isAdminDataConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
