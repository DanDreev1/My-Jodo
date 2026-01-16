"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function ModalShell({ title, children }: Props) {
  const router = useRouter();

  const close = () => router.back();

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Overlay (click to close) */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={close}
        className="absolute inset-0 bg-black/40"
      />

      {/* Centered container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "relative w-full max-w-[720px]",
            "rounded-2xl border border-black/20 bg-[#FFF7F0]",
            "shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-black/10">
            <div className="font-alt text-lg md:text-xl font-semibold text-[#251c16]">
              {title}
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="h-10 w-10 flex items-center justify-center"
            >
              <X className="h-5 w-5 text-[#251c16]" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="max-h-[80dvh] overflow-y-auto no-scrollbar px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}