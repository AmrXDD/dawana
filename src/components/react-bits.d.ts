/**
 * Ambient types for the react-bits components installed via
 * `npx shadcn@latest add @react-bits/...`.
 *
 * They ship as untyped .jsx. Declaring their surfaces here gives us
 * autocomplete and prop checking at the call sites without forking the
 * vendor source (which would make future re-installs a merge job).
 */

declare module "@/components/ScrollExpand" {
  import type { CSSProperties, ReactNode } from "react";

  export interface ScrollExpandProps {
    src?: string;
    mediaType?: "image" | "video";
    poster?: string;
    alt?: string;
    /** Rendered inside the title layer, so rich content is fine. */
    title?: ReactNode;
    scrollHint?: string;
    /** Starting frame width as a % of the viewport. */
    startWidth?: number;
    /** Starting frame height as a % of the viewport. */
    startHeight?: number;
    startRadius?: number;
    endRadius?: number;
    mediaZoom?: number;
    scrollDistance?: number;
    holdDistance?: number;
    smoothing?: number;
    overlayScrim?: number;
    /** Drive from window scroll rather than an inner scroll container. */
    useWindowScroll?: boolean;
    enabled?: boolean;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  }

  const ScrollExpand: (props: ScrollExpandProps) => JSX.Element;
  export default ScrollExpand;
}

declare module "@/components/CardNav" {
  export interface CardNavLink {
    label: string;
    href?: string;
    ariaLabel?: string;
  }

  export interface CardNavItem {
    label: string;
    bgColor?: string;
    textColor?: string;
    links?: CardNavLink[];
  }

  export interface CardNavProps {
    logo: string;
    logoAlt?: string;
    /** Only the first three items are rendered by the component. */
    items: CardNavItem[];
    className?: string;
    ease?: string;
    baseColor?: string;
    menuColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    /** Added locally so the CTA is a real link, not a dead button. */
    ctaLabel?: string;
    ctaHref?: string;
  }

  const CardNav: (props: CardNavProps) => JSX.Element;
  export default CardNav;
}

declare module "@/components/SideRays" {
  export interface SideRaysProps {
    speed?: number;
    rayColor1?: string;
    rayColor2?: string;
    intensity?: number;
    spread?: number;
    origin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    tilt?: number;
    saturation?: number;
    blend?: number;
    falloff?: number;
    opacity?: number;
    className?: string;
  }

  const SideRays: (props: SideRaysProps) => JSX.Element;
  export default SideRays;
}
