"use client";

import type { CalendarEvent } from "@/types/event";
import { FileText } from "lucide-react";
import { TAG_COLOR, DEFAULT_TAG } from "@/lib/eventTags";

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function MonthEventRow({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: () => void;
}) {
  const stripeColor = TAG_COLOR[event.tag ?? DEFAULT_TAG];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left",
        "rounded-lg border border-black/60 bg-[#FFE4D4]",
        "shadow-[0_8px_16px_rgba(0,0,0,0.18)]",
        "overflow-hidden",
        onClick ? "cursor-pointer hover:brightness-[0.99]" : "cursor-default",
      ].join(" ")}
    >
      <div className="flex items-center">
        {/* left color bar */}
        <div
          className="w-2.5 self-stretch"
          style={{ backgroundColor: stripeColor }}
        />

        <div className="flex-1 min-w-0 px-2 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-black shrink-0" />

            <div
              className="font-alt font-semibold text-[14px] leading-[1.15] truncate"
              title={event.title}
            >
              {event.title}
            </div>

            <div className="ml-auto font-alt text-[12px] opacity-80 shrink-0">
              {hhmm(event.start_at)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}