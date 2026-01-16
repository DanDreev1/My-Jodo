"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { MobileViewDropdown } from "./MobileViewDropdown";
import { useCalendarStore } from "@/stores/useCalendarStore";

export type CalendarView = "day" | "week" | "month" | "agenda";

type Props = {
  view: CalendarView;
  label: string;
};

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative px-2 py-1 text-sm md:text-base",
        "font-alt",
        active ? "font-semibold" : "font-medium opacity-80 hover:opacity-100",
      ].join(" ")}
    >
      {children}
      <span
        className={[
          "pointer-events-none absolute left-0 right-0 -bottom-1 mx-auto h-0.5 w-full",
          active ? "bg-[#E85A4F]" : "bg-transparent",
        ].join(" ")}
      />
    </button>
  );
}

function Divider() {
  return <div className="mx-4 h-6 w-px bg-[#251c16]/40" />;
}

export function CalendarControls({ view, label }: Props) {
  // ✅ экшены и состояние берём из стора
  const setView = useCalendarStore((s) => s.setView);
  const goPrev = useCalendarStore((s) => s.goPrev);
  const goNext = useCalendarStore((s) => s.goNext);

  return (
    <section className="sticky top-20 z-10 bg-[#FFF7F0]">
      <div className="h-22.5 px-4 md:px-8 pt-4 pb-3 flex items-center gap-4">
        {/* LEFT: arrows + label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous"
            className="h-10 w-10 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-[#251c16]" />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next"
            className="h-10 w-10 flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-[#251c16]" />
          </button>

          <div className="font-alt text-base md:text-lg font-semibold">
            {label}
          </div>
        </div>

        {/* DESKTOP tabs */}
        <div className="hidden md:flex md:ml-auto items-center">
          <Divider />
          <TabButton active={view === "day"} onClick={() => setView("day")}>
            Day
          </TabButton>
          <Divider />
          <TabButton active={view === "week"} onClick={() => setView("week")}>
            Week
          </TabButton>
          <Divider />
          <TabButton active={view === "month"} onClick={() => setView("month")}>
            Month
          </TabButton>
          <Divider />
          <TabButton
            active={view === "agenda"}
            onClick={() => setView("agenda")}
          >
            Agenda
          </TabButton>
          <Divider />
        </div>

        {/* MOBILE dropdown */}
        <MobileViewDropdown view={view} setView={setView} top={140} />
      </div>

      {/* линия под контролами */}
      <div className="h-0.5 bg-black shadow-[0_6px_12px_rgba(0,0,0,0.60)]" />
    </section>
  );
}