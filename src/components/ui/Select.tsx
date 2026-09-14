"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Select — a custom listbox that replaces the native <select>.

   Motion: the panel springs open from the trigger with a soft blur-in, the
   options drift in on a short stagger, and a highlight pill glides between
   options as you hover or arrow through them (a shared-layout animation).
   The chosen option carries a mint check.

   Behaviour follows the WAI-ARIA "select-only combobox" pattern: focus stays
   on the trigger (role=combobox) and aria-activedescendant points into the
   listbox, so screen readers track the active option without focus moving.
   Arrow keys, Home/End, Enter/Space, Escape and type-to-jump all work.

   The panel is portalled to <body> with fixed positioning so scrolling
   containers (the admin's product drawer) can't clip it; it flips above the
   trigger when there's no room below and follows it on scroll.

   A hidden input carries the value, so it still submits with a plain form.
   ───────────────────────────────────────────────────────────────────────── */

export interface SelectOption {
  value: string;
  label: string;
  /** Optional one-line hint shown beneath the label. */
  description?: string;
}

interface SelectProps {
  /** Either pass options, or <option> elements as children like a native select. */
  options?: SelectOption[];
  children?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Submits the value with the surrounding form. */
  name?: string;
  id?: string;
  placeholder?: string;
  tone?: "light" | "dark";
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  Children.toArray(children).forEach((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child)) return;
    if (child.type !== "option") return;
    const text = Children.toArray(child.props.children).join("");
    out.push({
      value: child.props.value != null ? String(child.props.value) : text,
      label: text,
    });
  });
  return out;
}

const TONE = {
  light: {
    trigger:
      "border-[color:var(--color-hairline)] bg-paper-pure/80 text-ink hover:border-mint-300 " +
      "focus-visible:border-mint-500 focus-visible:ring-2 focus-visible:ring-mint/25 " +
      "data-[open=true]:border-mint-500 data-[open=true]:ring-2 data-[open=true]:ring-mint/20",
    size: "px-4 py-3 text-[0.95rem]",
    chevron: "text-ink-faint",
    placeholder: "text-ink-faint/70",
    panel:
      "border-[color:var(--color-hairline)] bg-paper-pure/95 " +
      "shadow-[0_28px_70px_-24px_rgba(3,90,81,0.38),0_2px_8px_rgba(3,90,81,0.06)]",
    highlight: "bg-mint-50",
    label: "text-ink",
    labelSelected: "text-deep",
    description: "text-ink-faint",
    check: "text-mint-600",
  },
  dark: {
    trigger:
      "border-[color:var(--color-night-line)] bg-night-raised/70 text-mint-50 hover:border-mint/35 " +
      "focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/25 " +
      "data-[open=true]:border-mint data-[open=true]:ring-2 data-[open=true]:ring-mint/20",
    size: "px-3.5 py-2.5 text-sm",
    chevron: "text-mint-300/50",
    placeholder: "text-mint-300/35",
    panel:
      "border-[color:var(--color-night-line)] bg-night-raised/95 " +
      "shadow-[0_28px_70px_-18px_rgba(0,0,0,0.7),0_0_0_1px_rgba(92,188,167,0.04)]",
    highlight: "bg-mint/12",
    label: "text-mint-100/85",
    labelSelected: "text-mint-50",
    description: "text-mint-300/50",
    check: "text-mint",
  },
} as const;

const GAP = 8;
const EDGE = 12;
const MAX_PANEL = 320;

interface Placement {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  side: "bottom" | "top";
  maxHeight: number;
}

export default function Select({
  options,
  children,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  placeholder = "Select…",
  tone = "light",
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const items = useMemo(() => options ?? optionsFromChildren(children), [options, children]);
  const t = TONE[tone];

  const uid = useId();
  const listId = `${uid}-listbox`;
  const optionId = (i: number) => `${uid}-option-${i}`;

  // Uncontrolled falls back to the first option, exactly like a native select.
  const [inner, setInner] = useState(() => defaultValue ?? items[0]?.value ?? "");
  const current = value !== undefined ? value : inner;
  const selectedIndex = items.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : undefined;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);

  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ buffer: "", timer: 0 });

  useEffect(() => setMounted(true), []);

  const measure = useCallback(() => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const wanted = Math.min(MAX_PANEL, items.length * 52 + 12);
    const side: Placement["side"] = below >= Math.min(wanted, 220) || below >= above ? "bottom" : "top";
    const room = side === "bottom" ? below : above;
    setPlace({
      left: r.left,
      width: r.width,
      side,
      maxHeight: Math.max(140, Math.min(MAX_PANEL, room)),
      ...(side === "bottom"
        ? { top: r.bottom + GAP }
        : { bottom: window.innerHeight - r.top + GAP }),
    });
  }, [items.length]);

  const openList = useCallback(
    (at?: number) => {
      if (disabled || !items.length) return;
      measure();
      setActive(at ?? (selectedIndex >= 0 ? selectedIndex : 0));
      setOpen(true);
    },
    [disabled, items.length, measure, selectedIndex],
  );

  /* `active` is deliberately NOT reset here. Clearing it unmounts the
     layoutId highlight pill in the same render the panel starts its exit,
     and AnimatePresence then never finishes — the invisible panel stayed in
     the DOM, fixed over the page, catching clicks. openList() sets a fresh
     active index every time it opens anyway. */
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const commit = useCallback(
    (index: number) => {
      const option = items[index];
      if (!option) return;
      if (value === undefined) setInner(option.value);
      if (option.value !== current) onValueChange?.(option.value);
      close();
      trigger.current?.focus();
    },
    [items, value, current, onValueChange, close],
  );

  // Follow the trigger while open: scroll (any container) and resize.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, measure]);

  // Dismiss on pointer down outside the trigger and the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (trigger.current?.contains(target) || list.current?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, close]);

  // Keep the active option in view inside a scrolling list.
  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(`${uid}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  const jumpTo = (char: string) => {
    const ta = typeahead.current;
    window.clearTimeout(ta.timer);
    ta.buffer += char.toLowerCase();
    ta.timer = window.setTimeout(() => (ta.buffer = ""), 550);

    const from = open ? active : selectedIndex;
    const order = [...items.keys()].map((k) => (k + from + 1) % items.length);
    // A single repeated letter cycles through matches; a typed word matches the prefix.
    const query = ta.buffer.split("").every((c) => c === ta.buffer[0]) ? ta.buffer[0] : ta.buffer;
    const hit = order.find((i) => items[i].label.toLowerCase().startsWith(query));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else commit(hit);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const last = items.length - 1;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList(e.key === "ArrowUp" ? Math.max(0, selectedIndex) : undefined);
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        jumpTo(e.key);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        break;
      case "Escape":
        // Close only this — not a dialog or drawer listening further out.
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) jumpTo(e.key);
    }
  };

  const longList = items.length > 12;

  return (
    <MotionConfig reducedMotion="user">
      {name && <input type="hidden" name={name} value={current} />}

      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required}
        disabled={disabled}
        data-open={open}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-tight border text-left outline-none",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          t.trigger,
          t.size,
          className,
        )}
      >
        <span className={cn("min-w-0 truncate", !selected && t.placeholder)}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          aria-hidden="true"
          className={cn("grid shrink-0 place-items-center", t.chevron)}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <ChevronDown className="size-4" strokeWidth={1.8} />
        </motion.span>
      </button>

      {mounted &&
        createPortal(
          <MotionConfig reducedMotion="user">
            <AnimatePresence>
              {open && place && (
                <motion.div
                  ref={list}
                  id={listId}
                  role="listbox"
                  aria-label={ariaLabel}
                  // Lenis hijacks the wheel for smooth page scroll; let long
                  // lists scroll natively instead.
                  data-lenis-prevent
                  tabIndex={-1}
                  initial={{
                    opacity: 0,
                    y: place.side === "bottom" ? -6 : 6,
                    scale: 0.97,
                    filter: "blur(6px)",
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    y: place.side === "bottom" ? -4 : 4,
                    scale: 0.985,
                    filter: "blur(3px)",
                    // Stop catching clicks from the first frame of the exit, so
                    // a closing panel can never block what's underneath it.
                    pointerEvents: "none",
                    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
                  }}
                  transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.7 }}
                  style={{
                    position: "fixed",
                    left: place.left,
                    width: place.width,
                    top: place.top,
                    bottom: place.bottom,
                    maxHeight: place.maxHeight,
                    transformOrigin: place.side === "bottom" ? "top center" : "bottom center",
                  }}
                  className={cn(
                    "u-scroll-slim z-[90] overflow-y-auto overscroll-contain rounded-[14px] border p-1.5 backdrop-blur-xl",
                    t.panel,
                  )}
                  onMouseLeave={() => setActive(selectedIndex)}
                >
                  <motion.ul
                    role="presentation"
                    className="flex flex-col gap-0.5"
                    initial="hidden"
                    animate="shown"
                    variants={{
                      shown: {
                        transition: longList
                          ? {}
                          : { staggerChildren: 0.022, delayChildren: 0.035 },
                      },
                    }}
                  >
                    {items.map((option, i) => {
                      const isSelected = option.value === current;
                      const isActive = i === active;
                      return (
                        <motion.li
                          key={option.value}
                          id={optionId(i)}
                          role="option"
                          aria-selected={isSelected}
                          variants={
                            longList
                              ? undefined
                              : {
                                  hidden: { opacity: 0, y: 4 },
                                  shown: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
                                }
                          }
                          // Keep focus on the trigger; select on click.
                          onPointerDown={(e) => e.preventDefault()}
                          onPointerMove={() => active !== i && setActive(i)}
                          onClick={() => commit(i)}
                          className="relative flex cursor-pointer select-none items-start gap-3 rounded-[10px] px-3 py-2.5"
                        >
                          {isActive && (
                            <motion.span
                              layoutId={`${uid}-highlight`}
                              aria-hidden="true"
                              className={cn("absolute inset-0 rounded-[10px]", t.highlight)}
                              transition={{ type: "spring", stiffness: 640, damping: 42, mass: 0.6 }}
                            />
                          )}

                          <span className="relative min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-[0.9rem] leading-snug transition-colors duration-150",
                                isSelected ? cn(t.labelSelected, "font-medium") : t.label,
                              )}
                            >
                              {option.label}
                            </span>
                            {option.description && (
                              <span className={cn("mt-0.5 block text-[0.75rem] leading-snug", t.description)}>
                                {option.description}
                              </span>
                            )}
                          </span>

                          <span className="relative grid size-5 shrink-0 place-items-center pt-0.5">
                            <AnimatePresence initial={false}>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.4, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                                  className={t.check}
                                >
                                  <Check className="size-4" strokeWidth={2.2} aria-hidden="true" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </motion.div>
              )}
            </AnimatePresence>
          </MotionConfig>,
          document.body,
        )}
    </MotionConfig>
  );
}
