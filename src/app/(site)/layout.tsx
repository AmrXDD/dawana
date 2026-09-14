import SiteNav from "@/components/site/SiteNav";
import Footer from "@/components/site/Footer";
import Backdrop from "@/components/site/Backdrop";
import SiteGate from "@/components/site/SiteGate";
import { CatalogProvider } from "@/components/site/CatalogPresence";
import SmoothScroll from "@/components/motion/SmoothScroll";
import PageTransition from "@/components/motion/PageTransition";
import Cursor from "@/components/motion/Cursor";
import { getCatalogPresence } from "@/lib/catalog";

/* Pages stay statically rendered; this is the backstop refresh for the
   catalogue check. Admin saves revalidate immediately via /api/revalidate. */
export const revalidate = 300;

/* Without JavaScript the loader could never finish, so drop it and show the
   server-rendered site instead of a loader that never leaves. */
const NO_JS_FALLBACK =
  "<style>.dw-loader{display:none!important}[data-gate]{visibility:visible!important;opacity:1!important}</style>";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const presence = await getCatalogPresence();

  return (
    <CatalogProvider value={presence}>
      <noscript dangerouslySetInnerHTML={{ __html: NO_JS_FALLBACK }} />
      <Backdrop />
      {/* Outside the gate so it also works over the heartbeat loader. */}
      <Cursor />
      <SiteGate>
        <SmoothScroll />
        <SiteNav />
        <main id="main" className="relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer presence={presence} />
      </SiteGate>
    </CatalogProvider>
  );
}
