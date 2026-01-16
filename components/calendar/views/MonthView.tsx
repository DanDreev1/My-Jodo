"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useEventsQuery } from "@/hooks/calendar/useEventsQuery";
import type { CalendarEvent } from "@/types/event";
import { MonthEventRow } from "@/components/calendar/MonthEventRow";

const STICKY_OFFSET_PX = 172; // Topbar (80) + CalendarControls (~92)

/* ---------------- date helpers (no date-fns) ---------------- */

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

/** Monday-based week start */
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun, 1 Mon ...
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d: Date) {
  // local stable key
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function fmtMonthDow(d: Date) {
  // "Mon"
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function fmtMonthDay(d: Date) {
  return d.getDate(); // number
}

/* ---------------- layout constants ---------------- */

// ширину колонки можно легко менять (ты просил +20px)
const DAY_COL_W = 180; // было условно 200, теперь 220
const CELL_MIN_H = 140; // высота ячейки (можешь подкрутить)

/* ---------------- view ---------------- */

export function MonthView() {
  const anchorDate = useCalendarStore((s) => s.anchorDate);

  // ---- month grid: 6 weeks (Mon..Sun)
  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate]);
  const gridStart = useMemo(() => startOfWeekMonday(monthStart), [monthStart]);

  const weeks = useMemo(() => {
    // 6 недель * 7 дней
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i))
    );
  }, [gridStart]);

  // ---- range for events: from gridStart to gridEndExclusive
  const gridEndExclusive = useMemo(() => addDays(gridStart, 42), [gridStart]); // 6*7 = 42

  const { data: events = [], isLoading } = useEventsQuery({
    from: gridStart,
    to: gridEndExclusive,
  });

  // ---- group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.start_at);
      const k = dayKey(d);
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    }
    return map;
  }, [events]);

  // ---- expanded logic shared (на будущее)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // =======================
  // Header-X sync like Week
  // =======================
  const headerXRef = useRef<HTMLDivElement | null>(null);
  const bodyXRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = headerXRef.current;
    const b = bodyXRef.current;
    if (!h || !b) return;

    let lock: "h" | "b" | null = null;
    let raf = 0;

    const onHScroll = () => {
      if (lock === "b") return;
      lock = "h";
      b.scrollLeft = h.scrollLeft;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (lock = null));
    };

    const onBScroll = () => {
      if (lock === "h") return;
      lock = "b";
      h.scrollLeft = b.scrollLeft;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (lock = null));
    };

    h.addEventListener("scroll", onHScroll, { passive: true });
    b.addEventListener("scroll", onBScroll, { passive: true });

    return () => {
      h.removeEventListener("scroll", onHScroll);
      b.removeEventListener("scroll", onBScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ---- header days (Mon..Sun) from gridStart row
  const headerDays = useMemo(() => weeks[0] ?? [], [weeks]);

  const setView = useCalendarStore((s) => s.setView);
  const setAnchorDate = useCalendarStore((s) => s.setAnchorDate);

  function goToDay(d: Date) {
    // важное: фиксируем "локальную полночь", чтобы не ловить сдвиги
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);

    setAnchorDate(x);
    setView("day");
  }

  return (
    <section className="relative bg-[#FFF7F0]">
      {/* ===== Sticky Header (moves with body only in X via sync) ===== */}
      <div
        className="sticky z-30 bg-[#FFE4D4] border-b border-black/10"
        style={{ top: STICKY_OFFSET_PX }}
      >
        {/* header needs overflow-x to sync, but we can hide scrollbar */}
        <div
          ref={headerXRef}
          className="overflow-x-auto overflow-y-hidden"
          style={{
            scrollbarWidth: "none",
          }}
        >
          <div
            style={{
              minWidth: DAY_COL_W * 7,
              display: "grid",
              gridTemplateColumns: `repeat(7, ${DAY_COL_W}px)`,
            }}
          >
            {headerDays.map((d) => (
              <div
                key={d.toISOString()}
                className="px-3 py-3 font-alt text-sm md:text-base font-semibold border-r border-black/10 last:border-r-0"
              >
                {fmtMonthDow(d)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Body (X scroll) ===== */}
      <div
        ref={bodyXRef}
        className="overflow-x-auto"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        <div
          style={{
            minWidth: DAY_COL_W * 7,
          }}
        >
          {/* 6 week rows */}
          {weeks.map((week, wIdx) => (
            <div
              key={wIdx}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(7, ${DAY_COL_W}px)`,
              }}
            >
              {week.map((d) => {
                const inMonth = d.getMonth() === anchorDate.getMonth();
                const isToday = isSameDay(d, new Date());
                const dayEvents = eventsByDay.get(dayKey(d)) ?? [];
                const moreCount = Math.max(0, dayEvents.length - 1);

                return (
                  <div
                    key={d.toISOString()}
                    className={[
                      "border-r border-black/10 last:border-r-0 border-b",
                      "p-3",
                    ].join(" ")}
                    style={{ minHeight: CELL_MIN_H }}
                  >
                    {/* date number */}
                    <button
                        type="button"
                        onClick={() => goToDay(d)}
                        className={[
                            "font-alt text-left",
                            "hover:underline underline-offset-4",
                            "focus:outline-none",
                            inMonth ? "font-bold text-[#251c16]" : "font-light text-[#251c16]/50",
                        ].join(" ")}
                        aria-label={`Open ${d.toDateString()}`}
                    >
                        <span
                            className={[
                            isToday ? "underline underline-offset-4" : "",
                            ].join(" ")}
                        >
                            {fmtMonthDay(d)}
                        </span>
                    </button>

                    {/* events stack (для старта: показываем все, без +X more) */}
                    <div className="mt-2 space-y-2">
                        {!isLoading && dayEvents[0] ? (
                            <MonthEventRow
                            event={dayEvents[0]}
                            onClick={() => goToDay(d)}
                            />
                        ) : null}
                    </div>

                    {moreCount > 0 && (
                        <div className="mt-6 font-sans text-[12px] text-[#251c16]/70">
                            +{moreCount} more
                        </div>
                    )}

                    {/* никаких "Loading/No events" — пусто значит пусто */}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}