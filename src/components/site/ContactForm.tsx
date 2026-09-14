"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Pill, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Select, { type SelectOption } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

/* Values are the exact strings the API and inbox already expect. The
   descriptions help a visitor pick the right desk. */
const SUBJECTS: SelectOption[] = [
  { value: "Product enquiry", label: "Product enquiry", description: "Availability and supply of a specific product" },
  { value: "General enquiry", label: "General enquiry", description: "Questions about Dawana or our services" },
  { value: "Distribution partnership", label: "Distribution partnership", description: "Represent your brand in Kuwait" },
  { value: "Product registration", label: "Product registration", description: "Ministry of Health registration support" },
  { value: "Tender opportunity", label: "Tender opportunity", description: "Government and institutional tenders" },
  { value: "Careers", label: "Careers", description: "Join the Dawana team" },
];

type Errors = Partial<Record<"name" | "email" | "message", string>>;

const inputCls =
  "w-full rounded-tight border border-[color:var(--color-hairline)] bg-paper-pure/80 px-4 py-3 text-[0.95rem] text-ink " +
  "placeholder:text-ink-faint/60 outline-none transition-colors duration-200 " +
  "focus:border-mint-500 focus:ring-2 focus:ring-mint/25";

function Row({
  id,
  label,
  error,
  children,
  required,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[0.82rem] font-medium text-deep">
        {label}
        {required && (
          <span className="ml-1 text-mint-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-[0.78rem] text-signal-bad">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  /* Arriving from a product page: the enquiry is about that product. The
     name is only for display — the server looks the product up by its
     address and writes the subject itself. */
  const params = useSearchParams();
  const [product, setProduct] = useState(() => {
    const slug = params.get("product");
    return slug ? { slug, name: params.get("name")?.slice(0, 120) || slug } : null;
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    // Validate before the round trip so errors land next to the field.
    const next: Errors = {};
    if (!data.name?.trim()) next.name = "Please tell us your name.";
    if (!data.email?.trim()) next.email = "We need an email to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      next.email = "That email doesn't look right.";
    if (!data.message?.trim() || data.message.trim().length < 10)
      next.message = "A little more detail helps us route your enquiry.";

    setErrors(next);
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, product: product?.slug }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");

      setDone(true);
      toast.success("Message sent. We'll be in touch.");
      form.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-mint-300 bg-mint-50/70 p-10 text-center backdrop-blur-[2px]">
        <CheckCircle2
          className="mx-auto size-10 text-mint-600"
          strokeWidth={1.4}
          aria-hidden="true"
        />
        <h2 className="mt-5 font-display text-[1.4rem] font-semibold tracking-tight text-deep">
          Message received
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[0.92rem] leading-relaxed text-ink-soft">
          Thank you — the team has your message and we aim to respond within one
          business day.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 text-[0.85rem] text-deep underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot — bots fill it, humans never see it. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="company_website">Leave this empty</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Row id="name" label="Name" error={errors.name} required>
          <input
            id="name"
            name="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-err" : undefined}
            className={cn(inputCls, errors.name && "border-signal-bad")}
            placeholder="Your full name"
          />
        </Row>

        <Row id="email" label="Email" error={errors.email} required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-err" : undefined}
            className={cn(inputCls, errors.email && "border-signal-bad")}
            placeholder="you@company.com"
          />
        </Row>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Row id="organisation" label="Organisation">
          <input
            id="organisation"
            name="organisation"
            autoComplete="organization"
            className={inputCls}
            placeholder="Company or institution"
          />
        </Row>

        <Row id="subject" label="Subject">
          <Select
            id="subject"
            name="subject"
            tone="light"
            options={SUBJECTS}
            defaultValue={product ? "Product enquiry" : "General enquiry"}
          />
        </Row>
      </div>

      {product && (
        <div className="flex items-center gap-3 rounded-tight border border-mint-300 bg-mint-50/80 px-4 py-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-deep text-mint">
            <Pill className="size-4" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="u-eyebrow text-mint-700">Enquiring about</p>
            <p className="truncate text-[0.95rem] font-medium text-deep">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setProduct(null)}
            aria-label="Remove product from this enquiry"
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-white hover:text-deep"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Row id="message" label="Message" error={errors.message} required>
        <textarea
          id="message"
          name="message"
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-err" : undefined}
          className={cn(inputCls, "resize-y leading-relaxed", errors.message && "border-signal-bad")}
          placeholder={
            product
              ? "Quantity needed, your pharmacy, clinic or institution, and delivery area."
              : "Tell us a little about what you need."
          }
        />
      </Row>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={loading} arrow={!loading}>
          {loading ? "Sending" : "Send message"}
        </Button>
        <p className="text-[0.78rem] text-ink-faint">
          We reply within one business day.
        </p>
      </div>
    </form>
  );
}
