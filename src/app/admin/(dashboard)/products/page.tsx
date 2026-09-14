import { requireAdmin } from "@/lib/auth/admin";
import { PageHead } from "@/components/admin/Shell";
import ProductsManager from "@/components/admin/ProductsManager";
import { getCollections, getProducts } from "@/lib/admin-data";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin("catalog");
  const [products, collections] = await Promise.all([
    getProducts({ limit: 300 }),
    getCollections(),
  ]);

  return (
    <>
      <PageHead
        title="Products"
        description="The catalogue behind the public portfolio. Unpublished rows stay invisible to visitors."
      />
      <ProductsManager
        initialProducts={products.rows}
        collections={collections.rows}
        configured={products.configured}
      />
    </>
  );
}
