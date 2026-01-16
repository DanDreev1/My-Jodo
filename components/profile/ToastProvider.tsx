"use client";

import React, { createContext, useCallback, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs: number;
  closing?: boolean;
};

type ToastInput = {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (t: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

const IN_MS = 180;
const OUT_MS = 160;

function typeStyles(type: ToastType) {
  if (type === "success") return "border-[#0f766e]/25 bg-[#0f766e]/10";
  if (type === "error") return "border-[#c24a36]/25 bg-[#c24a36]/10";
  return "border-[#251c16]/15 bg-white/70";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  // store timers so we can cancel them (prevents double-removes & leaks)
  const timers = useRef<
    Record<string, { startClose?: number; remove?: number }>
  >({});

  const clearTimers = useCallback((id: string) => {
    const t = timers.current[id];
    if (t?.startClose) window.clearTimeout(t.startClose);
    if (t?.remove) window.clearTimeout(t.remove);
    delete timers.current[id];
  }, []);

  const removeNow = useCallback(
    (id: string) => {
      clearTimers(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    },
    [clearTimers]
  );

  const startClose = useCallback(
    (id: string) => {
      // already scheduled to remove -> do nothing
      if (timers.current[id]?.remove) return;

      // mark closing (animation out)
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
      );

      // after OUT_MS remove from DOM
      timers.current[id] = {
        ...(timers.current[id] ?? {}),
        remove: window.setTimeout(() => removeNow(id), OUT_MS),
      };
    },
    [removeNow]
  );

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `t_${Date.now()}_${counter.current++}`;

      const item: ToastItem = {
        id,
        type: input.type ?? "info",
        title: input.title,
        message: input.message,
        durationMs: input.durationMs ?? 2200,
        closing: false,
      };

      // add toast
      setItems((prev) => [item, ...prev].slice(0, 4));

      // schedule close a bit before removal so we see the exit animation
      const closeAt = Math.max(0, item.durationMs - OUT_MS);

      timers.current[id] = {
        startClose: window.setTimeout(() => startClose(id), closeAt),
      };
    },
    [startClose]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* viewport */}
      <div
        className={[
            "fixed z-260",
            "left-0 right-0 bottom-0",
            "pointer-events-none",
        ].join(" ")}
        style={{
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 12,
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        }}
        aria-live="polite"
        aria-relevant="additions"
      >
        <div
            className={[
            "mx-auto flex w-full flex-col gap-2",
            "max-w-140 md:mx-0 md:ml-auto md:max-w-90",
            "md:mr-6 md:mb-6",
            ].join(" ")}
        >
          {items.map((t) => (
            <div
              key={t.id}
              role="status"
              className={[
                "pointer-events-auto w-full rounded-2xl border p-3 backdrop-blur",
                "shadow-[0_18px_60px_-55px_rgba(0,0,0,0.35)]",
                "will-change-transform will-change-opacity",
                t.closing ? "animate-toast-out" : "animate-toast-in",
                typeStyles(t.type),
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {t.title ? (
                    <p className="text-sm font-semibold">{t.title}</p>
                  ) : null}
                  <p className="mt-0.5 wrap-break-word text-xs opacity-80">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startClose(t.id);
                  }}
                  className={[
                    "shrink-0 rounded-xl px-3 py-2 text-xs font-semibold",
                    "min-h-9",
                    "border border-[#251c16]/15 bg-white/70",
                    "transition-colors duration-150",
                    "hover:bg-white hover:border-[#251c16]/25",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  ].join(" ")}
                >
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes toastOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
            filter: blur(2px);
          }
        }

        .animate-toast-in {
          animation: toastIn ${IN_MS}ms ease-out both;
        }

        .animate-toast-out {
          animation: toastOut ${OUT_MS}ms ease-in both;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-toast-in,
          .animate-toast-out {
            animation: none !important;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}