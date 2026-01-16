"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, EllipsisVertical } from "lucide-react";
import { createPortal } from "react-dom";

type CalendarView = "day" | "week" | "month" | "agenda";

const VIEW_LABEL: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  agenda: "Agenda",
};

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export function MobileViewDropdown({
  view,
  setView,
  top = 140,
}: {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  top?: number;
}) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null); // кнопка + контейнер
  const dropdownRef = useRef<HTMLDivElement | null>(null); // сам dropdown (в Portal)

  // ✅ outside click: считаем "внутри", если клик попал ЛИБО в menuRef, ЛИБО в dropdownRef
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      const inMenu = !!(t && menuRef.current?.contains(t));
      const inDrop = !!(t && dropdownRef.current?.contains(t));

      if (!inMenu && !inDrop) setOpen(false);
    };

    // capture=true чтобы отработать раньше других слушателей
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  return (
    <div className="md:hidden ml-auto relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Change view"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 flex items-center justify-center"
      >
        <EllipsisVertical className="h-6 w-6 text-[#251c16]" />
      </button>

      {open && (
        <Portal>
          {/* backdrop (не обязателен, но удобно) */}
          <div className="fixed inset-0 z-[200]" />

          <div
            ref={dropdownRef}
            className={[
              "fixed right-4 z-[210] w-40",
              "rounded-2xl border border-[#251c16]/40 bg-[#FFE4D4]",
              "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
              "overflow-hidden",
            ].join(" ")}
            style={{ top }}
          >
            {(["day", "week", "month", "agenda"] as CalendarView[]).map((v) => {
              const active = v === view;

              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setView(v);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-left px-4 py-3",
                    "font-alt text-sm",
                    "border-b border-[#251c16]/25 last:border-b-0",
                    active ? "font-semibold" : "font-medium opacity-90",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        active ? "bg-[#E85A4F]" : "bg-transparent",
                      ].join(" ")}
                    />
                    <span>{VIEW_LABEL[v]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}
