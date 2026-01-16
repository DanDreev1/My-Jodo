"use client";

import { create } from "zustand";

export type AimsView = "year" | "month" | "week" | "day";

function addYears(d: Date, y: number) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + y);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function wStartDayForDate(d: Date) {
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 8;
  if (day <= 21) return 15;
  return 22;
}
function startOfWBlock(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), wStartDayForDate(d), 0, 0, 0, 0);
}

function clampDayInMonth(y: number, m0: number, day: number) {
  const last = new Date(y, m0 + 1, 0).getDate();
  return Math.min(day, last);
}

type State = {
  view: AimsView;
  anchorDate: Date;

  setView: (v: AimsView) => void;
  setAnchorDate: (d: Date) => void;

  goPrev: () => void;
  goNext: () => void;

  returnToToday: () => void;
};

export const useAimsStore = create<State>((set, get) => ({
  view: "month",
  anchorDate: new Date(),

  setView: (v) => {
    const { anchorDate } = get();
    if (v === "day") set({ view: v, anchorDate: startOfWBlock(anchorDate) });
    else set({ view: v, anchorDate }); // year/month/week держат реальную дату
  },

  setAnchorDate: (d) => set({ anchorDate: d }),

  goPrev: () => {
    const { view, anchorDate } = get();

    if (view === "year") {
        set({ anchorDate: addYears(anchorDate, -1) });
        return;
    }

    if (view === "month") {
        // год назад, но сохраняем месяц/день (если возможно)
        const y = anchorDate.getFullYear() - 1;
        const m = anchorDate.getMonth();
        const d = clampDayInMonth(y, m, anchorDate.getDate());
        set({ anchorDate: new Date(y, m, d, 0, 0, 0, 0) });
        return;
    }

    if (view === "week") {
        // месяц назад, сохраняем день
        const y = anchorDate.getFullYear();
        const m = anchorDate.getMonth() - 1;
        const tmp = new Date(y, m, 1);
        const d = clampDayInMonth(tmp.getFullYear(), tmp.getMonth(), anchorDate.getDate());
        set({ anchorDate: new Date(tmp.getFullYear(), tmp.getMonth(), d, 0, 0, 0, 0) });
        return;
    }

    // day-view: переключаемся W-блоками назад (7 дней)
    set({ anchorDate: startOfWBlock(addDays(anchorDate, -7)) });
  },

  goNext: () => {
    const { view, anchorDate } = get();

    if (view === "year") {
        set({ anchorDate: addYears(anchorDate, 1) });
        return;
    }

    if (view === "month") {
        const y = anchorDate.getFullYear() + 1;
        const m = anchorDate.getMonth();
        const d = clampDayInMonth(y, m, anchorDate.getDate());
        set({ anchorDate: new Date(y, m, d, 0, 0, 0, 0) });
        return;
    }

    if (view === "week") {
        const y = anchorDate.getFullYear();
        const m = anchorDate.getMonth() + 1;
        const tmp = new Date(y, m, 1);
        const d = clampDayInMonth(tmp.getFullYear(), tmp.getMonth(), anchorDate.getDate());
        set({ anchorDate: new Date(tmp.getFullYear(), tmp.getMonth(), d, 0, 0, 0, 0) });
        return;
    }

    set({ anchorDate: startOfWBlock(addDays(anchorDate, 7)) });
  },

  returnToToday: () => {
    const { view } = get();
    const now = new Date();

    if (view === "day") set({ anchorDate: startOfWBlock(now) });
    else set({ anchorDate: now }); // month/week держат реальную дату
  },
}));
