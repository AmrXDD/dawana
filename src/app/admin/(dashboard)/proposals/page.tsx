import { PageHead } from "@/components/admin/Shell";
import ProposalGenerator from "@/components/admin/ProposalGenerator";
import { isAdminDataConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Proposals" };
export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  await requireAdmin("documents");
  return (
    <>
      <PageHead
        title="Proposal generator"
        description="Build a costed commercial proposal — cover, narrative and investment schedule."
      />
      <ProposalGenerator configured={isAdminDataConfigured()} />
    </>
  );
}
