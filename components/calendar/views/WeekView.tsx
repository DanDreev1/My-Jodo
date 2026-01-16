"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useEventsQuery } from "@/hooks/calendar/useEventsQuery";
import { WeekEventCard } from "@/components/calendar/WeekEventCard";
import type { CalendarEvent } from "@/types/event";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const RAIL_W = 72;
const HOUR_ROW_H = 64;
const STICKY_OFFSET_PX = 172;

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function inRange(d: Date, start: Date, endInclusive: Date) {
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(endInclusive).getTime();
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function fmtWeekHeader(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}
function topPxForStart(startAtIso: string, day: Date) {
  const t = new Date(startAtIso);
  if (!isSameDay(t, day)) return null;
  const minutes = t.getHours() * 60 + t.getMinutes();
  return (minutes / 60) * HOUR_ROW_H;
}

export function WeekView() {
  const anchorDate = useCalendarStore((s) => s.anchorDate);

  const weekStart = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);
  const weekEndExclusive = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const weekEndInclusive = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const { data: events = [], isLoading } = useEventsQuery({ from: weekStart, to: weekEndExclusive });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.start_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    return map;
  }, [events]);

  const nowLineTop = useMemo(() => {
    const now = new Date();
    if (!inRange(now, weekStart, weekEndInclusive)) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / 60) * HOUR_ROW_H;
  }, [weekStart, weekEndInclusive]);

  // ✅ refs for horizontal sync
  const headerXRef = useRef<HTMLDivElement | null>(null);
  const bodyXRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = headerXRef.current;
    const b = bodyXRef.current;
    if (!h || !b) return;

    let lock = false;

    const onHeader = () => {
      if (lock) return;
      lock = true;
      b.scrollLeft = h.scrollLeft;
      requestAnimationFrame(() => (lock = false));
    };

    const onBody = () => {
      if (lock) return;
      lock = true;
      h.scrollLeft = b.scrollLeft;
      requestAnimationFrame(() => (lock = false));
    };

    h.addEventListener("scroll", onHeader, { passive: true });
    b.addEventListener("scroll", onBody, { passive: true });

    return () => {
      h.removeEventListener("scroll", onHeader);
      b.removeEventListener("scroll", onBody);
    };
  }, []);

  const MIN_CANVAS_W = 1200;

  return (
    <section className="bg-[#FFF7F0]">
      {/* =================== HEADER (sticky по Y) =================== */}
      <div className="sticky z-30 bg-[#FFE4D4] border-b border-black/10" style={{ top: STICKY_OFFSET_PX }}>
        {/* ✅ horizontal scroll ONLY, sticky wrapper без overflow */}
        <div ref={headerXRef} className="overflow-x-auto no-scrollbar">
          <div style={{ minWidth: MIN_CANVAS_W }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `${RAIL_W}px repeat(7, minmax(0, 1fr))`,
                alignItems: "center",
              }}
            >
              <div className="h-full border-r border-black/10" />
              {days.map((d) => {
                const today = isSameDay(d, new Date());
                return (
                  <div
                    key={d.toISOString()}
                    className={[
                      "px-2 py-3 font-alt text-sm md:text-base",
                      "border-r border-black/10 last:border-r-0",
                      today ? "font-semibold" : "font-medium",
                    ].join(" ")}
                  >
                    {fmtWeekHeader(d)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =================== BODY (скролл по Y страницы + скролл по X) =================== */}
      <div ref={bodyXRef} className="overflow-x-auto">
        <div style={{ minWidth: MIN_CANVAS_W }}>
          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns: `${RAIL_W}px repeat(7, minmax(0, 1fr))`,
            }}
          >
            {/* RAIL */}
            <div className="flex-none border-r border-black/10 bg-[#FFE4D4]" style={{ width: RAIL_W }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-center text-[11px] font-sans text-black/70 border-b border-black/10"
                  style={{ height: HOUR_ROW_H }}
                >
                  <span className="mt-6">{pad2(h)}:00</span>
                </div>
              ))}
            </div>

            {/* 7 day columns */}
            {days.map((d) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const dayEvents = eventsByDay.get(key) ?? [];

              return (
                <div key={d.toISOString()} className="border-r border-black/10 last:border-r-0 relative">
                  {Array.from({ length: 48 }, (_, i) => {
                    const isHourLine = i % 2 === 0;
                    return (
                      <div
                        key={i}
                        className={isHourLine ? "border-b border-black/10" : "border-b border-dashed border-black/20"}
                        style={{ height: HOUR_ROW_H / 2 }}
                      />
                    );
                  })}

                  {!isLoading && dayEvents.length > 0 && (
                    <div className="absolute inset-0 z-1 mx-1.25 pr-2">
                      {dayEvents.map((ev) => {
                        const topPx = topPxForStart(ev.start_at, d);
                        if (topPx === null) return null;
                        return (
                          <WeekEventCard
                            key={ev.id}
                            event={ev}
                            topPx={topPx}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* current time line (не на rail) */}
            {nowLineTop !== null && (
              <div
                className="pointer-events-none absolute"
                style={{
                  top: nowLineTop,
                  left: RAIL_W,
                  right: 0,
                }}
              >
                <div className="h-0.5 bg-black" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
