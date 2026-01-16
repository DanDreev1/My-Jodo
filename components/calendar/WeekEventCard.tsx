"use client";

import type { CalendarEvent } from "@/types/event";
import { FileText } from "lucide-react";
import { TAG_COLOR, DEFAULT_TAG } from "@/lib/eventTags";
import { useCalendarStore } from "@/stores/useCalendarStore";

type Props = {
  event: CalendarEvent;
  topPx: number;
};

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function WeekEventCard({ event, topPx }: Props) {
  const stripColor = TAG_COLOR[event.tag ?? DEFAULT_TAG];

  const setView = useCalendarStore((s) => s.setView);
  const setAnchorDate = useCalendarStore((s) => s.setAnchorDate);

  const goToDayFromEvent = () => {
    const d = new Date(event.start_at);
    // локальная полночь дня события
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    setAnchorDate(x);
    setView("day");
  };

  return (
    <div className="absolute left-0 right-0 z-10" style={{ top: topPx }}>
      <button
        type="button"
        onClick={goToDayFromEvent}
        className={[
          "block w-full min-w-0 text-left",
          "rounded-lg border border-black/20 bg-[#FFE4D4]",
          "shadow-[0_8px_16px_rgba(0,0,0,0.12)]",
          "overflow-hidden",
          "active:scale-[0.995] transition",
        ].join(" ")}
      >
        <div className="flex w-full min-w-0">
          {/* left stripe */}
          <div
            className="w-2 shrink-0 rounded-l-lg"
            style={{ backgroundColor: stripColor }}
          />

          {/* content */}
          <div className="flex-1 min-w-0 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-[#251c16]" />

              <div className="flex-1 min-w-0">
                <div
                  className={[
                    "font-alt font-semibold",
                    "text-[13px] md:text-[14px]",
                    "leading-[1.2] truncate",
                  ].join(" ")}
                  title={event.title}
                >
                  {event.title}
                </div>
              </div>

              <div className="shrink-0 whitespace-nowrap font-alt text-[12px] md:text-[13px] opacity-80">
                {hhmm(event.start_at)}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}