"use client";

import { useEffect, useRef } from "react";
import { useConfirmStore } from "@/stores/confirmStore";

export function ConfirmModal() {
  const {
    open,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
    hide,
  } = useConfirmStore();

  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel?.();
        hide();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel, hide]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-250">
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => {
          onCancel?.();
          hide();
        }}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />

      <div className="absolute left-1/2 top-1/2 w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "rounded-[28px] border border-[#251c16]/15 bg-white/85 p-5 md:p-6",
            "shadow-[0_30px_90px_-60px_rgba(0,0,0,0.6)] backdrop-blur",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-alt text-lg font-bold">{title}</h3>

          {description ? (
            <p className="mt-2 text-sm opacity-75">{description}</p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onCancel?.();
                hide();
              }}
              disabled={loading}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold",
                "border border-[#251c16]/20 bg-white/70",
                "hover:bg-white hover:border-[#251c16]/30",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {cancelText}
            </button>

            <button
              ref={confirmBtnRef}
              type="button"
              onClick={async () => {
                await onConfirm?.();
                hide();
              }}
              disabled={loading}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold text-white",
                danger ? "bg-[#c24a36]" : "bg-[#0f766e]",
                "hover:opacity-95 active:opacity-90",
                loading ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {loading ? "Please wait…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}