import { PageHead } from "@/components/admin/Shell";
import CollectionsManager from "@/components/admin/CollectionsManager";
import { getCollections } from "@/lib/admin-data";

export const metadata = { title: "Collections" };
export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await getCollections();

  return (
    <>
      <PageHead
        title="Collections"
        description="Groupings that organise the portfolio — by therapeutic area, brand family or campaign."
      />
      <CollectionsManager
        initialCollections={collections.rows}
        configured={collections.configured}
      />
    </>
  );
}
