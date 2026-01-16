"use client";

import { create } from "zustand";

export type CalendarView = "day" | "week" | "month" | "agenda";

type CalendarState = {
  view: CalendarView;
  anchorDate: Date;

  setView: (view: CalendarView) => void;
  setAnchorDate: (date: Date) => void;

  goPrev: () => void;
  goNext: () => void;
  goToday: () => void;

  expandedEventId: string | null;
  toggleExpandedEvent: (id: string) => void;
  closeExpandedEvent: () => void;
};

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // IMPORTANT: по твоему UX, при входе на Calendar по дефолту Agenda
  view: "agenda",
  anchorDate: new Date(),

  setView: (view) => set({ view }),
  setAnchorDate: (date) => set({ anchorDate: date }),

  expandedEventId: null,

  toggleExpandedEvent: (id) =>
    set((s) => ({ expandedEventId: s.expandedEventId === id ? null : id })),

  closeExpandedEvent: () => set({ expandedEventId: null }),

  goPrev: () => {
    const { view, anchorDate } = get();
    if (view === "day" || view === "agenda") return set({ anchorDate: addDays(anchorDate, -1) });
    if (view === "week") return set({ anchorDate: addDays(anchorDate, -7) });
    return set({ anchorDate: addMonths(anchorDate, -1) }); // month
  },

  goNext: () => {
    const { view, anchorDate } = get();
    if (view === "day" || view === "agenda") return set({ anchorDate: addDays(anchorDate, 1) });
    if (view === "week") return set({ anchorDate: addDays(anchorDate, 7) });
    return set({ anchorDate: addMonths(anchorDate, 1) }); // month
  },

  goToday: () => set({ anchorDate: new Date() }),
}));