"use client";

import { useMemo, useState } from "react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useEventsQuery } from "@/hooks/calendar/useEventsQuery";
import type { CalendarEvent } from "@/types/event";
import { EventCard } from "@/components/calendar/EventCard";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const RAIL_W = 72;
const HOUR_ROW_H = 64;
const STICKY_OFFSET_PX = 172;

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayHeader(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** минуты от начала anchorDate (локально), clamp 0..1439 */
function minutesSinceAnchorStart(iso: string, anchorDate: Date) {
  const t = new Date(iso).getTime();
  const s = startOfDayLocal(anchorDate).getTime();
  const diffMin = Math.floor((t - s) / 60000);
  return Math.max(0, Math.min(1439, diffMin));
}

function topPxForStart(iso: string, anchorDate: Date) {
  const mins = minutesSinceAnchorStart(iso, anchorDate);
  return (mins / 60) * HOUR_ROW_H;
}

export function DayView() {
  const anchorDate = useCalendarStore((s) => s.anchorDate);

  // range на 1 день: [startOfDay, nextDay)
  const range = useMemo(() => {
    const from = startOfDayLocal(anchorDate);
    const to = addDays(from, 1);
    return { from, to };
  }, [anchorDate]);

  const { data, isLoading } = useEventsQuery(range);
  const events = (data ?? []) as CalendarEvent[];

  // одна expanded карточка
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const nowLineTop = useMemo(() => {
    const now = new Date();
    if (!isSameDay(now, anchorDate)) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / 60) * HOUR_ROW_H;
  }, [anchorDate]);

  return (
    <section className="relative bg-[#FFF7F0]">
      {/* ===== Sticky day header ===== */}
      <div
        className="sticky z-30 border-b border-black/10 bg-[#FFE4D4]"
        style={{ top: STICKY_OFFSET_PX }}
      >
        <div className="relative">
          <div className="px-20 py-3 font-alt text-base md:text-lg font-semibold">
            {formatDayHeader(anchorDate)}
          </div>

          {/* Вертикальная линия там где заканчивается rail */}
          <div className="absolute top-0 bottom-0" style={{ left: RAIL_W }}>
            <div className="h-full w-px bg-black/10" />
          </div>
        </div>
      </div>

      {/* ===== Scroll content: rail + grid together ===== */}
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateColumns: `${RAIL_W}px minmax(0, 1fr)`,
        }}
      >
        {/* RAIL */}
        <div className="border-r border-black/10 bg-[#FFE4D4]">
          {HOURS.map((h) => (
            <div
              key={h}
              className="relative flex items-start justify-center text-[11px] font-sans text-black/70"
              style={{ height: HOUR_ROW_H }}
            >
              {/* solid :00 line on rail */}
              <div className="absolute left-0 right-0 bottom-0 h-px bg-black/10" />
              <span className="mt-2">{pad2(h)}:00</span>
            </div>
          ))}
        </div>

        {/* GRID AREA */}
        <div className="relative" style={{ minHeight: HOUR_ROW_H * 24 }}>
          {/* half-hour grid lines */}
          {Array.from({ length: 48 }, (_, i) => {
            const isHourLine = i % 2 === 0;
            return (
              <div
                key={i}
                className={
                  isHourLine
                    ? "border-b border-black/10"
                    : "border-b border-dashed border-black/20"
                }
                style={{ height: HOUR_ROW_H / 2 }}
              />
            );
          })}

          {/* Current time indicator — ТОЛЬКО в grid area (не заходит на rail) */}
          {nowLineTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0"
              style={{ top: nowLineTop }}
            >
              <div className="h-0.5 bg-black shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
            </div>
          )}

          {/* Events */}

          <div className="absolute inset-0 ml-1.75">
            {!isLoading &&
                events.map((ev) => {
                const topPx = topPxForStart(ev.start_at, anchorDate);

                return (
                    <EventCard
                    key={ev.id}
                    event={ev}
                    topPx={topPx}
                    />
                );
                })}
            </div>
        </div>
      </div>
    </section>
  );
}
