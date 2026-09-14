import { PageHead } from "@/components/admin/Shell";
import ContractGenerator from "@/components/admin/ContractGenerator";
import { isAdminDataConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Contracts" };
export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  await requireAdmin("documents");
  return (
    <>
      <PageHead
        title="Contract generator"
        description="Draft a distribution agreement on the Dawana letterhead from the standard clause set."
      />
      <ContractGenerator configured={isAdminDataConfigured()} />
    </>
  );
}
