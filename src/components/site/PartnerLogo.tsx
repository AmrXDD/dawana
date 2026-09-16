import Image from "next/image";
import type { PartnerLogo as PartnerLogoData } from "@/lib/partners";
import { cn } from "@/lib/utils";

/**
 * A partner's logo on a white tile. Several source logos carry their own
 * white ground, so the tile is always pure white and they sit flush.
 */
export default function PartnerLogo({
  partner,
  className,
  sizes = "180px",
}: {
  partner: PartnerLogoData;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-card border border-[color:var(--color-hairline)] bg-paper-pure",
        className,
      )}
    >
      {/* Fill a fixed inner box so small or square logos scale up to the
          same optical weight as the wide wordmarks. */}
      <div className="relative h-[60%] w-[78%]">
        <Image src={partner.logo} alt={partner.name} fill sizes={sizes} className="object-contain" />
      </div>
    </div>
  );
}
