"use client";

import { useEffect, useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { useNotesStore } from "@/stores/useNotesStore";
import type { NotesTab } from "@/stores/useNotesStore";

const TAB_LABEL: Record<NotesTab, string> = {
  all: "All",
  insight: "Insights",
  thoughts: "Thoughts",
  idea: "Ideas",
  plan: "Plans",
};

const TABS: NotesTab[] = ["all", "insight", "thoughts", "idea", "plan"];

export function MobileNotesFilterDropdown({ top = 140 }: { top?: number }) {
  const tab = useNotesStore((s) => s.tab);
  const setTab = useNotesStore((s) => s.setTab);

  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      const inMenu = !!(t && menuRef.current?.contains(t));
      const inDrop = !!(t && dropdownRef.current?.contains(t));
      if (!inMenu && !inDrop) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  return (
    <div className="md:hidden ml-auto relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Change filter"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 flex items-center justify-center"
      >
        <EllipsisVertical className="h-6 w-6 text-[#251c16]" />
      </button>

      {open && (
        <Portal>
          {/* кликабельный оверлей — надёжно закрывает */}
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-200"
            onClick={() => setOpen(false)}
          />

          <div
            ref={dropdownRef}
            className={[
              "fixed right-4 z-210 w-44",
              "rounded-2xl border border-[#251c16]/40 bg-[#FFE4D4]",
              "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
              "overflow-hidden",
            ].join(" ")}
            style={{ top }}
          >
            {TABS.map((v) => {
              const active = v === tab;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setTab(v);
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
                    <span>{TAB_LABEL[v]}</span>
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