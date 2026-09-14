import { requireAdmin } from "@/lib/auth/admin";
import { PageHead } from "@/components/admin/Shell";
import HealthBoard from "@/components/admin/HealthBoard";

export const metadata = { title: "Site health" };
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  await requireAdmin("health");
  return (
    <>
      <PageHead
        title="Site health"
        description="Live probes against every dependency the site relies on. Each check runs a real query, not just an environment-variable lookup."
      />
      <HealthBoard />
    </>
  );
}
