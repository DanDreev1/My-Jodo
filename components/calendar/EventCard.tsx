"use client";

import { useMemo, useRef } from "react";
import type { CalendarEvent } from "@/types/event";
import { FileText, MapPin, EllipsisVertical } from "lucide-react";
import { TAG_COLOR, DEFAULT_TAG } from "@/lib/eventTags";
import { useRouter } from "next/navigation";
import { useCalendarStore } from "@/stores/useCalendarStore";

type Props = {
  event: CalendarEvent;
  topPx: number;
};

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function timeRange(startIso: string, endIso?: string | null) {
  const s = hhmm(startIso);
  const e = endIso ? hhmm(endIso) : null;
  return e ? `${s}–${e}` : s;
}

export function EventCard({ event, topPx }: Props) {
  const stripColor = TAG_COLOR[event.tag ?? DEFAULT_TAG];
  const router = useRouter();

  // ✅ expanded state from store
  const expandedEventId = useCalendarStore((s) => s.expandedEventId);
  const toggleExpandedEvent = useCalendarStore((s) => s.toggleExpandedEvent);
  const expanded = expandedEventId === event.id;

  const range = useMemo(
    () => timeRange(event.start_at, event.end_at ?? null),
    [event.start_at, event.end_at]
  );

  // ---- double tap support (mobile) ----
  const lastTapRef = useRef<number>(0);

  const toggle = () => toggleExpandedEvent(event.id);

  const handlePointerUp = (e: React.PointerEvent) => {
    // mouse — пусть обрабатывает onDoubleClick
    if (e.pointerType === "mouse") return;

    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta > 0 && delta < 320) toggle();
  };

  return (
    <div
      className={[
        "absolute left-0 select-none",
      ].join(" ")}
      style={{
        top: topPx,
        width: "calc(100% - 10px)",
        maxWidth: 340,
      }}
      onDoubleClick={toggle}
      onPointerUp={handlePointerUp}
    >
      <div
        className={[
          "relative overflow-hidden",
          "rounded-lg border border-black/90",
          "bg-[#FFE4D4]",
          "shadow-[0_10px_18px_rgba(0,0,0,0.30)]",
        ].join(" ")}
      >
        {/* left color stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 md:w-4.5"
          style={{
            background: stripColor,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        />

        {/* content */}
        <div className="pl-6 pr-2 py-2 md:pl-7 md:pr-3 md:py-2">
          {/* TOP ROW */}
          <div className="flex items-center justify-between gap-2 md:gap-3">
            {/* Left: icon + title */}
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 md:h-5 md:w-5 text-black" />
              <div
                className={[
                  "font-alt font-semibold",
                  expanded ? "wrap-break-word leading-snug" : "truncate leading-[1.2]",
                  "text-[12px] md:text-[14px]",
                ].join(" ")}
                title={event.title}
              >
                {event.title}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 shrink-0">
              {!expanded ? (
                <div className="font-alt text-[12px] md:text-[14px] opacity-80">
                  {hhmm(event.start_at)}
                </div>
              ) : (
                <>
                  <div className="font-alt text-[12px] md:text-[14px] opacity-80">
                    {range}
                  </div>

                  <button
                    type="button"
                    aria-label="Edit event"
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-black/5"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ чтобы не закрывало/открывало карточку
                      router.push(`/calendar/edit/${event.id}`);
                    }}
                  >
                    <EllipsisVertical className="h-5 w-5 text-black/80" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* EXPANDED */}
          {expanded && (
            <div className="mt-3 space-y-3">
              {event.description ? (
                <div className="font-alt text-[11px] md:text-[12px] text-black/55 leading-relaxed">
                  {event.description}
                </div>
              ) : null}

              {event.location ? (
                <div className="flex items-center gap-3 text-black/70">
                  <MapPin className="h-4 w-4 text-black" />
                  <div className="font-alt text-[13px] md:text-[14px]">
                    {event.location}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}