import SiteNav from "@/components/site/SiteNav";
import Footer from "@/components/site/Footer";
import Backdrop from "@/components/site/Backdrop";
import SmoothScroll from "@/components/motion/SmoothScroll";
import PageTransition from "@/components/motion/PageTransition";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Backdrop />
      <SmoothScroll />
      <SiteNav />
      <main id="main" className="relative">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
