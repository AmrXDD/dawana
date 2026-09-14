'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
// use your own icon import if react-icons is not available
import { GoArrowUpRight } from 'react-icons/go';
import './CardNav.css';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  ctaLabel = 'Get Started',
  ctaHref = '#'
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  /* The state the visitor last asked for. Decisions read this rather than
     React state: `isExpanded` stays true until the close animation finishes,
     so a click during that window used to "close" an already-closing menu and
     the menu appeared not to open. */
  const wantOpenRef = useRef(false);
  const lastWidthRef = useRef(0);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const contentEl = navEl.querySelector('.card-nav-content');
    if (!contentEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const topBar = navEl.querySelector('.card-nav-top')?.offsetHeight || 60;

    if (isMobile) {
      const wasVisible = contentEl.style.visibility;
      const wasPointerEvents = contentEl.style.pointerEvents;
      const wasPosition = contentEl.style.position;
      const wasHeight = contentEl.style.height;

      contentEl.style.visibility = 'visible';
      contentEl.style.pointerEvents = 'auto';
      contentEl.style.position = 'static';
      contentEl.style.height = 'auto';

      contentEl.offsetHeight;

      const padding = 16;
      const contentHeight = contentEl.scrollHeight;

      contentEl.style.visibility = wasVisible;
      contentEl.style.pointerEvents = wasPointerEvents;
      contentEl.style.position = wasPosition;
      contentEl.style.height = wasHeight;

      return topBar + contentHeight + padding;
    }

    /* Desktop: tall enough for the fullest card, never shorter than the
       original 260px. Cards stretch to fill, so measure their natural height. */
    let tallest = 0;
    cardsRef.current.forEach(card => {
      if (!card) return;
      const was = card.style.height;
      card.style.height = 'auto';
      tallest = Math.max(tallest, card.scrollHeight);
      card.style.height = was;
    });
    // + content padding (16) + the nav's own 1px borders.
    return Math.max(260, topBar + tallest + 18);
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: navEl.querySelector('.card-nav-top')?.offsetHeight || 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        if (!wantOpenRef.current) setIsExpanded(false);
      }
    });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  /** Rebuilds the timeline (new items, new width) and parks it at the current state. */
  const rebuild = () => {
    tlRef.current?.kill();
    const tl = createTimeline();
    if (!tl) return;
    if (wantOpenRef.current) tl.progress(1);
    tlRef.current = tl;
  };

  useLayoutEffect(() => {
    rebuild();
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    lastWidthRef.current = window.innerWidth;
    const handleResize = () => {
      // Mobile browsers fire resize when the address bar slides on scroll.
      // Only a width change can change the layout, so ignore the rest.
      if (window.innerWidth === lastWidthRef.current) return;
      lastWidthRef.current = window.innerWidth;
      rebuild();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setOpen = open => {
    const tl = tlRef.current;
    if (!tl || wantOpenRef.current === open) return;
    wantOpenRef.current = open;
    setIsHamburgerOpen(open);
    if (open) {
      setIsExpanded(true);
      tl.play();
    } else {
      tl.reverse();
    }
  };

  const toggleMenu = () => setOpen(!wantOpenRef.current);

  // Lets the page transition close the menu while the screen is covered.
  useLayoutEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('cardnav:close', close);
    return () => window.removeEventListener('cardnav:close', close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes an open menu.
  useLayoutEffect(() => {
    if (!isExpanded) return;
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <img src={logo} alt={logoAlt} className="logo" />
          </div>

          <a
            href={ctaHref}
            className="card-nav-cta-button"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
          >
            {ctaLabel}
          </a>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor, ...(item.grow ? { flexGrow: item.grow } : {}) }}
            >
              <div className="nav-card-head">
                <div className="nav-card-label">{item.label}</div>
                {item.meta && <div className="nav-card-meta">{item.meta}</div>}
              </div>
              {item.grid?.length > 0 && (
                <div className="nav-card-grid">
                  {item.grid.map(g => (
                    <a
                      key={g.href}
                      className="nav-card-chip"
                      href={g.href}
                      onClick={e => {
                        if (!e.defaultPrevented) setOpen(false);
                      }}
                    >
                      {g.index && <span className="nav-card-chip-index">{g.index}</span>}
                      {g.label}
                    </a>
                  ))}
                </div>
              )}
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                    onClick={e => {
                      // A covered page transition closes it out of sight instead.
                      if (!e.defaultPrevented) setOpen(false);
                    }}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
