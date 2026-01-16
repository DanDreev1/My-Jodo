"use client";

import type { Aim, AimLevel } from "@/types/aim";
import { EllipsisVertical } from "lucide-react";

function fmtDeadlineLocal(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AimCard({
  aim,
  levelForStripe,
  showProgress,
  footer,
  progressOverride,
  progressMeta,
  doneOverride,
  onEdit,
}: {
  aim: Aim;
  levelForStripe: AimLevel;
  showProgress?: boolean;
  footer?: React.ReactNode;
  progressOverride?: number;
  progressMeta?: string;
  doneOverride?: boolean;
  onEdit?: () => void;
}) {
  const stripe =
  levelForStripe === "year"
    ? "bg-[#9B59B6]" // выбери цвет
    : levelForStripe === "month"
    ? "bg-[#E85A4F]"
    : levelForStripe === "week"
    ? "bg-[#1F6FEB]"
    : "bg-[#2DA44E]";

  const pctRaw = progressOverride ?? aim.progress ?? 0;
  const pct = Math.max(0, Math.min(100, pctRaw));

  const isDone = doneOverride ?? aim.status === "done";

  return (
    <div 
        className={[
            "relative overflow-hidden rounded-2xl border border-[#251c16]/15 bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
            isDone ? "opacity-70" : "",
        ].join(" ")}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-3 ${stripe}`} />

      {onEdit ? (
        <button
        type="button"
        onClick={onEdit}
        className="absolute right-3 top-3 z-1 h-9 w-9 rounded-full flex items-center justify-center hover:bg-black/5"
        aria-label="Edit aim"
        >
        <EllipsisVertical className="h-5 w-5 opacity-70" />
        </button>
      ) : null}

      <div className="pl-6 pr-5 py-4">
        <div className="font-alt text-xs opacity-70">
          {fmtDeadlineLocal(aim.end_at)}
        </div>

        <div 
            className={[
                "mt-1 font-alt text-lg font-semibold text-[#251c16]",
                isDone ? "line-through opacity-80" : "",
            ].join(" ")}
        >
          {aim.title}
        </div>

        <div className="mt-1 text-sm opacity-80">{aim.description}</div>

        {showProgress && (
            <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-alt opacity-80">
                    <span>Progress</span>

                    <span className="flex items-center gap-2">
                        {progressMeta ? (
                        <span className="opacity-70">{progressMeta}</span>
                        ) : null}
                        <span>{pct}%</span>
                    </span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
                    <div
                        className="h-full bg-black/80 rounded-full"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        )}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
