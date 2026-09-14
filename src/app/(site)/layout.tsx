import SiteNav from "@/components/site/SiteNav";
import Footer from "@/components/site/Footer";
import Backdrop from "@/components/site/Backdrop";
import SiteGate from "@/components/site/SiteGate";
import SmoothScroll from "@/components/motion/SmoothScroll";
import PageTransition from "@/components/motion/PageTransition";
import Cursor from "@/components/motion/Cursor";

/* Without JavaScript the loader could never finish, so drop it and show the
   server-rendered site instead of a loader that never leaves. */
const NO_JS_FALLBACK =
  "<style>.dw-loader{display:none!important}[data-gate]{visibility:visible!important;opacity:1!important}</style>";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
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
        <Footer />
      </SiteGate>
    </>
  );
}
