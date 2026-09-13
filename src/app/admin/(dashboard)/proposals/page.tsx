import { PageHead } from "@/components/admin/Shell";
import ProposalGenerator from "@/components/admin/ProposalGenerator";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Proposals" };
export const dynamic = "force-dynamic";

export default function ProposalsPage() {
  return (
    <>
      <PageHead
        title="Proposal generator"
        description="Build a costed commercial proposal — cover, narrative and investment schedule."
      />
      <ProposalGenerator configured={isSupabaseConfigured()} />
    </>
  );
}
