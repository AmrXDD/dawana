import { PageHead } from "@/components/admin/Shell";
import ReceiptGenerator from "@/components/admin/ReceiptGenerator";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Receipts" };
export const dynamic = "force-dynamic";

export default function ReceiptsPage() {
  return (
    <>
      <PageHead
        title="Receipt generator"
        description="Issue a branded payment receipt matching the printed pad from the brand book."
      />
      <ReceiptGenerator configured={isSupabaseConfigured()} />
    </>
  );
}
