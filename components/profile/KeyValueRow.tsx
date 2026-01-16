"use client";

import { useToast } from "@/hooks/ui/useToast";

export function KeyValueRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  copyValue?: string;
}) {
  const { toast } = useToast();

  const onCopy = async () => {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast({ type: "success", title: "Copied", message: `${label} copied to clipboard.` });
    } catch {
      toast({ type: "error", title: "Copy failed", message: "Could not access clipboard." });
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[#251c16]/10 bg-white/50 px-4 py-3">
        <div className="min-w-0">
            <p className="text-xs opacity-60">{label}</p>
            <p className="mt-1 wrap-break-word text-sm font-semibold leading-snug">
                {value}
            </p>
        </div>

        {copyValue ? (
            <button
                type="button"
                onClick={onCopy}
                className={[
                "rounded-xl px-3 py-2 text-xs font-semibold",
                "min-w-18 min-h-9",
                "border border-[#251c16]/15 bg-white/70",
                "transition-colors duration-150",
                "hover:bg-white hover:border-[#251c16]/25",
                "active:bg-white/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                ].join(" ")}
            >
                Copy
            </button>
        ) : null}
    </div>
  );
}