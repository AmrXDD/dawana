import { PageHead } from "@/components/admin/Shell";
import ReceiptGenerator from "@/components/admin/ReceiptGenerator";
import { isAdminDataConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Receipts" };
export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  await requireAdmin("documents");
  return (
    <>
      <PageHead
        title="Receipt generator"
        description="Issue a branded payment receipt matching the printed pad from the brand book."
      />
      <ReceiptGenerator configured={isAdminDataConfigured()} />
    </>
  );
}
