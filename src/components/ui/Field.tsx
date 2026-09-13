"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/* Dark-surface form controls for the admin. Labels are always visible —
   placeholder-as-label fails the moment a field is filled in. */

const control =
  "w-full rounded-tight border bg-night-raised/70 px-3.5 py-2.5 text-sm text-mint-50 " +
  "border-[color:var(--color-night-line)] placeholder:text-mint-300/35 " +
  "transition-colors duration-200 outline-none " +
  "focus:border-mint focus:ring-2 focus:ring-mint/25 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

interface WrapProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: WrapProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[0.78rem] font-medium text-mint-200/80">
        {label}
        {required && (
          <span className="ml-1 text-mint" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children(id, describedBy)}

      {hint && !error && (
        <p id={hintId} className="text-[0.72rem] leading-snug text-mint-300/45">
          {hint}
        </p>
      )}
      {/* Errors sit beside the field they belong to, never only at the top. */}
      {error && (
        <p id={errId} role="alert" className="text-[0.72rem] text-signal-bad">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "min-h-[7rem] resize-y leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
});

/** Convenience wrappers so most fields are a single line at the call site. */
export function TextField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: { label: string; hint?: string; error?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(id, describedBy) => (
        <Input id={id} aria-describedby={describedBy} required={required} {...props} />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: { label: string; hint?: string; error?: string; className?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(id, describedBy) => (
        <Textarea id={id} aria-describedby={describedBy} required={required} {...props} />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(id, describedBy) => (
        <Select id={id} aria-describedby={describedBy} required={required} {...props}>
          {children}
        </Select>
      )}
    </Field>
  );
}
