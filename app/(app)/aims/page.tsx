"use client";

import { useMemo } from "react";
import { AimsControls } from "@/components/aims/AimsControls";
import { useAimsStore } from "@/stores/useAimsStore";

import { MonthsView } from "@/components/aims/views/MonthsView";
import { WeeksView } from "@/components/aims/views/WeeksView";
import { DaysView } from "@/components/aims/views/DaysView";

import type { AimsView } from "@/stores/useAimsStore";
import { YearView } from "@/components/aims/views/YearView";

const fmtMonthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

function wIndexOfDate(d: Date) {
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}
function wRange(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const w = wIndexOfDate(d);

  const startDay = w === 1 ? 1 : w === 2 ? 8 : w === 3 ? 15 : 22;
  const endDay =
    w === 1 ? 7 : w === 2 ? 14 : w === 3 ? 21 : new Date(y, m + 1, 0).getDate();

  const start = new Date(y, m, startDay);
  const end = new Date(y, m, endDay);

  const left = start.toLocaleDateString("en-GB", { day: "2-digit" });
  const right = end.toLocaleDateString("en-GB", { day: "2-digit" });
  const mon = start.toLocaleDateString("en-GB", { month: "short" });

  return { w, label: `W${w} (${left}–${right} ${mon})` };
}

function getLabel(view: AimsView, anchorDate: Date) {
  if (view === "year") return `Year ${anchorDate.getFullYear()}`;
  if (view === "month") return String(anchorDate.getFullYear()); 
  if (view === "week") return fmtMonthYear.format(anchorDate);   
  return wRange(anchorDate).label;                               
}

export default function AimsPage() {
  const view = useAimsStore((s) => s.view);
  const anchorDate = useAimsStore((s) => s.anchorDate);

  const label = useMemo(() => getLabel(view, anchorDate), [view, anchorDate]);

  return (
    <div className="min-h-full">
      <AimsControls view={view} label={label} />

      {view === "year" && <YearView key={`year-${anchorDate.toISOString()}`}/>}
      {view === "month" && <MonthsView key={`month-${anchorDate.toISOString()}`}/>}
      {view === "week" && <WeeksView key={`week-${anchorDate.toISOString()}`}/>}
      {view === "day" && <DaysView key={`day-${anchorDate.toISOString()}`} />}
    </div>
  );
}
