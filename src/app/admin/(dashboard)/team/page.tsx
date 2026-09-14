import { PageHead } from "@/components/admin/Shell";
import TeamManager from "@/components/admin/TeamManager";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/server";
import type { AdminAccount } from "@/lib/types";

export const metadata = { title: "Team access" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const admin = await requireAdmin("team");

  const { data } = await createAdminClient()
    .from("admin_accounts")
    .select("id, username, full_name, role, is_active, last_login_at, created_at, locked_until")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHead
        title="Team access"
        description="Everyone who can sign in to the control room. Add a person, pick what they can do, and share their username and password with them."
      />
      <TeamManager
        initialMembers={(data ?? []) as AdminAccount[]}
        currentId={admin.id}
        currentRole={admin.role}
      />
    </>
  );
}
