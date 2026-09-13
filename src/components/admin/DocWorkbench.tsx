"use client";

import { useState, type ReactNode } from "react";
import { Printer, Save, Send, PanelRightClose, PanelRightOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Split workbench shared by the receipt, contract and proposal generators.
 *
 * Editor on the left, live A4 preview on the right. The preview is the real
 * print component scaled down with a CSS transform — not a mock — so what
 * you see is literally what prints.
 */
export default function DocWorkbench({
  editor,
  preview,
  reference,
  onSave,
  onSend,
  saving,
  sending,
  configured,
  sheets = 1,
}: {
  editor: ReactNode;
  preview: ReactNode;
  reference: string;
  onSave?: () => void;
  onSend?: () => void;
  saving?: boolean;
  sending?: boolean;
  configured: boolean;
  /** Number of A4 sheets, so the preview frame reserves the right height. */
  sheets?: number;
}) {
  const [showPreview, setShowPreview] = useState(true);

  // 210mm at 96dpi ≈ 794px. Scale to fit the preview column.
  const SCALE = 0.62;

  return (
    <div className="flex flex-col gap-5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[color:var(--color-night-line)] bg-night-raised/45 px-5 py-3.5">
        <p className="font-mono text-[0.8rem] tracking-tight text-mint-100">
          {reference}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview((v) => !v)}
            className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6 xl:hidden"
          >
            {showPreview ? (
              <PanelRightClose className="size-3.5" aria-hidden="true" />
            ) : (
              <PanelRightOpen className="size-3.5" aria-hidden="true" />
            )}
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
          >
            <Printer className="size-3.5" aria-hidden="true" />
            Print / PDF
          </Button>

          {onSend && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSend}
              loading={sending}
              disabled={!configured}
              className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
            >
              <Send className="size-3.5" aria-hidden="true" />
              Email
            </Button>
          )}

          {onSave && (
            <Button
              size="sm"
              variant="mint"
              onClick={onSave}
              loading={saving}
              disabled={!configured}
              title={configured ? undefined : "Connect Supabase to save documents"}
            >
              <Save className="size-3.5" aria-hidden="true" />
              Save
            </Button>
          )}
        </div>
      </div>

      {!configured && (
        <p className="rounded-tight border border-signal-warn/30 bg-signal-warn/8 px-4 py-3 text-[0.82rem] text-signal-warn">
          Supabase isn&apos;t connected, so documents can&apos;t be saved or
          numbered sequentially yet. Printing to PDF works regardless.
        </p>
      )}

      <div
        className={cn(
          "grid gap-5",
          showPreview ? "xl:grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1",
        )}
      >
        {/* Editor */}
        <div data-print="hide" className="min-w-0">
          {editor}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="min-w-0">
            <p
              data-print="hide"
              className="u-eyebrow mb-3 text-mint-300/45"
            >
              Live preview · A4
            </p>

            <div
              data-print="hide"
              className="u-scroll-slim overflow-auto rounded-card border border-[color:var(--color-night-line)] bg-night-raised/30 p-4"
              style={{ maxHeight: "calc(100vh - 14rem)" }}
            >
              {/* The wrapper reserves the scaled footprint so the scroll area
                  doesn't collapse around a transformed child. */}
              <div
                style={{
                  width: 794 * SCALE,
                  height: (1123 * sheets + 24 * (sheets - 1)) * SCALE,
                }}
              >
                <div
                  style={{
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                    width: 794,
                  }}
                  className="flex flex-col gap-6"
                >
                  {preview}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print-only render at full size. Hidden on screen, this is what the
          browser actually paginates. */}
      <div className="hidden print:block">{preview}</div>
    </div>
  );
}
