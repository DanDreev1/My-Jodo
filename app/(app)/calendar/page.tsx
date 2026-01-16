"use client";

import { useMemo } from "react";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { useCalendarStore } from "@/stores/useCalendarStore";

import { DayView } from "@/components/calendar/views/DayView";
import { WeekView } from "@/components/calendar/views/WeekView";
import { MonthView } from "@/components/calendar/views/MonthView";
import { AgendaView } from "@/components/calendar/views/AgendaView";

import type { CalendarView } from "@/stores/useCalendarStore";

/* ---------------- helpers (без date-fns) ---------------- */

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

/** Monday-based week start */
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun, 1 Mon ...
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

function endOfWeekSunday(d: Date) {
  return addDays(startOfWeekMonday(d), 6);
}

const fmtDayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

const fmtMonthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

/** label в шапке (стрелки+дата) */
function getLabel(view: CalendarView, anchorDate: Date) {
  if (view === "day") {
    return fmtDayMonth.format(anchorDate); // "20 Dec"
  }

  if (view === "week") {
    const s = startOfWeekMonday(anchorDate);
    const e = endOfWeekSunday(anchorDate);

    const sameMonth = s.getMonth() === e.getMonth();
    const sameYear = s.getFullYear() === e.getFullYear();

    const left = fmtDayMonth.format(s); // 17 Nov
    const right = sameMonth
      ? `${String(e.getDate()).padStart(2, "0")} ${fmtDayMonth.format(e).split(" ")[1]}`
      : fmtDayMonth.format(e);

    const year = sameYear ? s.getFullYear() : `${s.getFullYear()}–${e.getFullYear()}`;
    return `${left}–${right} ${year}`;
  }

  if (view === "month") {
    return fmtMonthYear.format(anchorDate); // "November 2025"
  }

  // agenda: как day (якорная дата = текущий видимый день / сейчас — просто anchorDate)
  return fmtDayMonth.format(anchorDate);
}

/* ---------------- page ---------------- */

export default function CalendarPage() {
  // ✅ единственный источник истины
  const view = useCalendarStore((s) => s.view);
  const anchorDate = useCalendarStore((s) => s.anchorDate);

  const label = useMemo(() => getLabel(view, anchorDate), [view, anchorDate]);

  return (
    <div className="min-h-full">
      <CalendarControls view={view} label={label} />

      {view === "day" && <DayView />}
      {view === "week" && <WeekView />}
      {view === "month" && <MonthView />}
      {view === "agenda" && <AgendaView />}
    </div>
  );
}