import Hero from "@/components/site/Hero";
import Intro from "@/components/site/Intro";
import ManifestoMarquee from "@/components/site/ManifestoMarquee";
import TherapeuticsScroller from "@/components/site/TherapeuticsScroller";
import MissionVision from "@/components/site/MissionVision";
import Values from "@/components/site/Values";
import Channels from "@/components/site/Channels";
import PartnersMarquee from "@/components/site/PartnersMarquee";
import SkylineReveal from "@/components/site/SkylineReveal";
import CTABand from "@/components/site/CTABand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <ManifestoMarquee />
      <TherapeuticsScroller />
      <MissionVision />
      <Values />
      <Channels />
      <PartnersMarquee />
      <SkylineReveal />
      {/* Follows the dark skyline plate — start the ramp at night. */}
      <CTABand enter="dark" />
    </>
  );
}
