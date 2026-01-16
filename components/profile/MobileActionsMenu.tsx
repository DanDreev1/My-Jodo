"use client";

import { useEffect, useRef, useState } from "react";
import { useEditNicknameModalStore } from "@/stores/useEditNicknameModalStore";
// если есть тосты — можешь подключить свой useToast()

export function MobileActionsMenu({
  nickname,
  canCopy,
  disabled,
}: {
  nickname: string;
  canCopy: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const showEdit = useEditNicknameModalStore((s) => s.show);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(nickname);
      // toast.success("Copied!");
    } catch {
      // toast.error("Failed to copy");
    }
  };

  const handleEdit = () => {
    showEdit({ initialValue: nickname });
  };

  return (
    <div className="relative sm:hidden">
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "shrink-0 rounded-full px-3 py-2.5 text-xs font-semibold",
          "border border-[#251c16]/20 bg-white/70",
          "transition-colors duration-150",
          "hover:bg-white hover:border-[#251c16]/30 active:bg-white/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span className="text-base leading-none">⋯</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={[
            "absolute right-15 top-[calc(100%-45px)] z-50",
            "w-44 rounded-2xl border border-[#251c16]/15 bg-white/90 backdrop-blur",
            "shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]",
            "p-1",
          ].join(" ")}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canCopy}
            onClick={async () => {
              setOpen(false);
              await handleCopy();
            }}
            className={[
              "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold",
              "transition-colors",
              canCopy
                ? "hover:bg-[#251c16]/5 active:bg-[#251c16]/10"
                : "opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            Copy nickname
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              handleEdit();
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-[#251c16]/5 active:bg-[#251c16]/10"
          >
            Edit nickname
          </button>
        </div>
      )}
    </div>
  );
}