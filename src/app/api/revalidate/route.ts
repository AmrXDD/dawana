import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Refreshes the statically rendered public site after a catalogue change.
 *
 * The admin writes products and collections straight to Supabase from the
 * browser, so nothing server-side would otherwise know the catalogue changed
 * and the public pages would wait out their revalidate window. The admin
 * calls this after each save so a newly published product (or the last one
 * unpublished) shows or hides immediately.
 *
 * Restricted to signed-in members of admin_users, so the public can't use it
 * to churn the cache.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // RLS lets a user read only their own admin_users row.
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Not an admin." }, { status: 403 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true });
}
