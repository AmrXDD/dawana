/**
 * Site backdrop.
 *
 * The reference is ECG graph paper — the substrate the brand's own pulse
 * motif is drawn on. Two nested grids (fine 8px, coarse 40px) in mint at
 * very low alpha, over a warm bone ground, with soft blooms in the corners
 * and a paper grain on top.
 *
 * Fixed and non-scrolling, so it reads as the surface the content sits on
 * rather than a decorative band that slides past.
 */
export default function Backdrop() {
  const fine = 8;
  const coarse = 40;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 bg-paper"
    >
      {/* Fine rule */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(3,90,81,0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(3,90,81,0.045) 1px, transparent 1px)
          `,
          backgroundSize: `${fine}px ${fine}px`,
        }}
      />

      {/* Coarse rule */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(3,90,81,0.085) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(3,90,81,0.085) 1px, transparent 1px)
          `,
          backgroundSize: `${coarse}px ${coarse}px`,
        }}
      />

      {/* Vignette — pulls the grid back at the edges so it never competes
          with type, and keeps the centre of the page calm. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 80% at 50% 0%, rgba(245,242,237,0.92) 0%, rgba(245,242,237,0.55) 38%, rgba(245,242,237,0.88) 100%)",
        }}
      />

      {/* Brand blooms */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 38% at 84% 12%, rgba(92,188,167,0.16) 0%, transparent 68%), radial-gradient(52% 42% at 8% 82%, rgba(3,90,81,0.09) 0%, transparent 70%)",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
