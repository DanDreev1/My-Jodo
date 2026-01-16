"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export function CalendarModalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-20 z-[60px]" 
      // top-16 = высота твоего App Topbar (64px). Если у тебя другая — поменяем.
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={() => router.back()}
      />

      {/* modal */}
      <div className="absolute inset-x-0 top-6 mx-auto w-[min(900px,92vw)]">
        <div className="rounded-2xl border border-[#251c16]/30 bg-[#FFF7F0] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#251c16]/15 px-6 py-4">
            <div className="font-alt text-lg font-semibold">{title}</div>
            <button
              className="rounded-xl px-3 py-1.5 hover:bg-[#251c16]/5"
              onClick={() => router.back()}
            >
              Close
            </button>
          </div>

          <div className="max-h-[75vh] overflow-auto px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
