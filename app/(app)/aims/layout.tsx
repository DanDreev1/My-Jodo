import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function AimsLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      {children}
      {modal}

      {/* Floating Action Button */}
      <Link
        href="/aims/new"
        aria-label="Create aim"
        className={[
          "fixed z-60", // выше контролов/контента
          "right-5 bottom-8",
          "h-14 w-14 rounded-full",
          "bg-white text-[#251c16]",
          "flex items-center justify-center",
          "shadow-[0_14px_35px_rgba(0,0,0,0.28)]",
          "border border-black/10",
          "active:scale-95 transition",
        ].join(" ")}
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  );
}
