"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AimsView } from "@/stores/useAimsStore";
import { useAimsStore } from "@/stores/useAimsStore";
import { MobileAimsViewDropdown } from "./MobileAimsViewDropdown";

type Props = {
  view: AimsView;
  label: string;
};

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
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
          "pointer-events-none absolute left-0 right-0 -bottom-1 mx-auto w-full",
          active ? "bg-[#E85A4F]" : "bg-transparent",
        ].join(" ")}
      />
    </button>
  );
}

function Divider() {
  return <div className="mx-4 h-6 w-px bg-[#251c16]/40" />;
}

export function AimsControls({ view, label }: Props) {
  const setView = useAimsStore((s) => s.setView);
  const onPrev = useAimsStore((s) => s.goPrev);
  const onNext = useAimsStore((s) => s.goNext);

  return (
    <section className="sticky top-19 z-10 bg-[#FFF7F0]">
      <div className="h-22.5 px-4 md:px-8 pt-4 pb-3 flex items-center gap-4">
        {/* LEFT: arrows + label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="h-10 w-10 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-[#251c16]" />
          </button>

          <button
            type="button"
            onClick={onNext}
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
            Days
          </TabButton>
          <Divider />
          <TabButton active={view === "week"} onClick={() => setView("week")}>
            Weeks
          </TabButton>
          <Divider />
          <TabButton active={view === "month"} onClick={() => setView("month")}>
            Months
          </TabButton>
          <Divider />
          <TabButton active={view === "year"} onClick={() => setView("year")}>
            Year
          </TabButton>
          <Divider />
        </div>

        {/* MOBILE dropdown */}
        <MobileAimsViewDropdown view={view} top={140} />
      </div>

      <div className="h-0.5 bg-black shadow-[0_6px_12px_rgba(0,0,0,0.60)]" />
    </section>
  );
}