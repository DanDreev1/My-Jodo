"use client";

import type { CalendarEvent } from "@/types/event";
import { EllipsisVertical, FileText, Clock3, MapPin } from "lucide-react";
import { TAG_COLOR, DEFAULT_TAG } from "@/lib/eventTags";
import { useRouter } from "next/navigation";

type Props = {
  event: CalendarEvent;
};

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function timeRange(ev: CalendarEvent) {
  const s = hhmm(ev.start_at);
  if (!ev.end_at) return `${s}–23:59`;
  return `${s}–${hhmm(ev.end_at)}`;
}

export function AgendaEventCard({ event }: Props) {
  const stripeColor = TAG_COLOR[event.tag ?? DEFAULT_TAG];
  const router = useRouter();

  return (
    <div
      className={[
        "relative w-full",
        "rounded-lg border border-black/30",
        "bg-[#FFE4D4] text-[#251c16]",
        "shadow-[0_10px_22px_rgba(0,0,0,0.18)]",
        "overflow-hidden",
      ].join(" ")}
    >
      {/* left color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3"
        style={{
          backgroundColor: stripeColor,
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}
      />

      <div className="pl-5 md:pl-6.25 pr-2 md:pr-3 py-3">
        {/* top row */}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-[#251c16]" />
              <div
                className={[
                  "font-alt font-semibold",
                  "text-[13px] md:text-[16px]",
                  "leading-[1.15]",
                  "truncate",
                ].join(" ")}
                title={event.title}
              >
                {event.title}
              </div>
            </div>
          </div>

          {/* dots (inactive for now) */}
          <button
            type="button"
            aria-label="Edit"
            className="h-6 w-6 flex items-center justify-center opacity-70 hover:opacity-100"
            onClick={(e) => {
                e.stopPropagation();

                if (!event.id) return;
                router.push(`/calendar/edit/${event.id}`);
            }}
          >
            <EllipsisVertical className="h-5 w-5 text-[#251c16]" />
          </button>
        </div>

        {/* details */}
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-3 text-[#251c16]/80">
            <Clock3 className="h-4 w-4 shrink-0" />
            <div className="font-alt text-[12px] md:text-[13px]">
              {timeRange(event)}
            </div>
          </div>

          {event.description && (
            <div className="font-alt text-[12px] md:text-[13px] text-[#251c16]/70 leading-snug">
              {event.description}
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-3 text-[#251c16]/80">
              <MapPin className="h-4 w-4 shrink-0" />
              <div className="font-alt text-[12px] md:text-[13px]">
                {event.location}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
