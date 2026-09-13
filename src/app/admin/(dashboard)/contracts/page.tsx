import { PageHead } from "@/components/admin/Shell";
import ContractGenerator from "@/components/admin/ContractGenerator";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Contracts" };
export const dynamic = "force-dynamic";

export default function ContractsPage() {
  return (
    <>
      <PageHead
        title="Contract generator"
        description="Draft a distribution agreement on the Dawana letterhead from the standard clause set."
      />
      <ContractGenerator configured={isSupabaseConfigured()} />
    </>
  );
}
