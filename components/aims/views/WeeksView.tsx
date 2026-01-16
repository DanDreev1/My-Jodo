"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAimsStore } from "@/stores/useAimsStore";
import { useWeekAims } from "@/hooks/aims/useAimsQueries";
import type { Aim } from "@/types/aim";
import { AimCard } from "@/components/aims/cards/AimCard";
import { useAimLinksForParents } from "@/hooks/aims/useAimLinksForParents";
import { computeWeekProgress } from "@/lib/aims/progress";
import { useRouter } from "next/navigation";

const STICKY_OFFSET_PX = 172;

function wIndexFromDate(d: Date) {
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function wLabel(monthAnchor: Date, w: 1 | 2 | 3 | 4) {
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();

  const startDay = w === 1 ? 1 : w === 2 ? 8 : w === 3 ? 15 : 22;
  const endDay =
    w === 1 ? 7 : w === 2 ? 14 : w === 3 ? 21 : new Date(y, m + 1, 0).getDate();

  const start = new Date(y, m, startDay);
  const end = new Date(y, m, endDay);

  const left = start.toLocaleDateString("en-GB", { day: "2-digit" });
  const right = end.toLocaleDateString("en-GB", { day: "2-digit" });
  const mon = start.toLocaleDateString("en-GB", { month: "short" });

  return `W${w} (${left}–${right} ${mon})`;
}

type AnyLink = {
  parent_id: string;
  child: any; // придёт либо объект, либо массив
};

function normalizeLinks(raw: AnyLink[]) {
  return raw
    .map((r) => {
      const child = Array.isArray(r.child) ? r.child[0] : r.child;
      if (!child) return null;

      return {
        parent_id: r.parent_id,
        child: {
          id: child.id,
          end_at: child.end_at,
          status: child.status,
          level: child.level,
        },
      };
    })
    .filter(Boolean) as {
    parent_id: string;
    child: { id: string; end_at: string; status: string; level: string };
  }[];
}


export function WeeksView() {
  const router = useRouter();
  const anchorDate = useAimsStore((s) => s.anchorDate); // normalized to startOfMonth for week view
  const returnToToday = useAimsStore((s) => s.returnToToday);

  const year = anchorDate.getFullYear();
  const monthIndex0 = anchorDate.getMonth();

  const { data = [], isLoading } = useWeekAims(year, monthIndex0);
  const aims = data as Aim[];

  const parentIds = useMemo(() => aims.map((a) => a.id), [aims]);
  const linksQ = useAimLinksForParents(parentIds);
  const linksRaw = linksQ.data ?? [];
  const links = useMemo(() => normalizeLinks(linksRaw as any), [linksRaw]);

  // empty state (no goals at all for this month)
  const hasAny = aims.length > 0;


  // group by W1..W4 (show only W with aims)
  const byW = useMemo(() => {
    const map = new Map<number, Aim[]>();
    for (const a of aims) {
      const d = new Date(a.end_at);
      const w = wIndexFromDate(d);
      const arr = map.get(w) ?? [];
      arr.push(a);
      map.set(w, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => +new Date(a.end_at) - +new Date(b.end_at));
    }
    return map;
  }, [aims]);

  const wKeys = useMemo(() => [...byW.keys()].sort((a, b) => a - b), [byW]);

  // focus W:
  // - if current month == today month and there are aims in today W -> focus it
  // - else first W with aims
  const today = useMemo(() => new Date(), []);
  const todayW = useMemo(() => wIndexFromDate(today), [today]);

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex0;

  const renderWKeys = useMemo(() => {
    if (!isCurrentMonth) return wKeys;
    const set = new Set(wKeys);
    set.add(todayW); 
    return [...set].sort((a, b) => a - b);
  }, [wKeys, isCurrentMonth, todayW]);

  const focusW = useMemo(() => {
    if (renderWKeys.length === 0) return null;
    if (isCurrentMonth) return todayW;
    return renderWKeys[0];
  }, [renderWKeys, isCurrentMonth, todayW]);

  const [scrollToFocusNonce, setScrollToFocusNonce] = useState(0);
  const [focusVisible, setFocusVisible] = useState(true);

  const showReturn = (!isCurrentMonth || !focusVisible);

  const refs = useRef(new Map<number, HTMLDivElement | null>());

  const setRef = (w: number) => (el: HTMLDivElement | null) => {
    refs.current.set(w, el);
  };

  useEffect(() => {
    if (!focusW) return;
    const el = refs.current.get(focusW);
    if (!el) return;

    const obs = new IntersectionObserver(
        (entries) => setFocusVisible(entries[0]?.isIntersecting ?? true),
        {
        root: null,
        rootMargin: `-${STICKY_OFFSET_PX + 8}px 0px 0px 0px`,
        threshold: 0.01,
        }
    );

    requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollToFocusNonce, focusW]);

  if (isLoading) {
    return <div className="px-4 md:px-8 py-6 font-alt opacity-70">Loading…</div>;
  }

  if (!hasAny) {
    return (
      <section className="bg-[#FFF7F0]">
        <div className="px-4 md:px-8 py-16 text-center">
          <div className="font-alt text-xl font-semibold text-[#251c16]">
            No aims yet.
          </div>
          <div className="mt-2 text-sm opacity-70">
            Create your first aim to start tracking your progress.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#FFF7F0]">
      <div className="px-4 md:px-8 py-6">
        <div className="space-y-6">
          {renderWKeys.map((wNum) => {
            const list = byW.get(wNum) ?? [];
            const isTodayW = isCurrentMonth && wNum === todayW;

            if (list.length === 0 && !isTodayW) return null;

            const w = wNum as 1 | 2 | 3 | 4;

            return (
                <div key={wNum} ref={setRef(wNum)} className="relative">
                <div className="flex gap-3 md:gap-4">
                    <div className={[
                        "shrink-0 font-alt font-semibold text-[#251c16]",
                        "w-18 text-[13px]",
                        "sm:w-28 sm:text-[14px]",
                        "md:w-40 md:text-[16px]",
                        "flex flex-col items-center md:items-start gap-3 text-center md:text-start"
                    ].join(" ")}>
                    {wLabel(anchorDate, w)}
                    {isTodayW ? (
                        <span className="inline-flex rounded-full bg-[#251c16]/10 px-2 py-0.5 text-[10px] font-semibold">
                        This week
                        </span>
                    ) : null}
                    </div>

                    <div className="flex-1 space-y-3">
                    {list.length ? (
                        list.map((aim) => {
                        const computed = computeWeekProgress(aim.id, links, 5);
                        return (
                            <AimCard
                            key={aim.id}
                            aim={aim}
                            levelForStripe="week"
                            showProgress
                            progressOverride={computed.progress}
                            progressMeta={`${computed.doneUnits}/${computed.totalUnits} days`}
                            onEdit={() => router.push(`/aims/${aim.id}/edit`)}
                            doneOverride={computed.isComplete}
                            />
                        );
                        })
                    ) : (
                        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm opacity-70">
                        No aims for this week yet.
                        </div>
                    )}
                    </div>
                </div>

                <div className="mt-6 h-px bg-black/10" />
                </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
            returnToToday();
            setScrollToFocusNonce((n) => n + 1);
        }}
        className={[
            "fixed left-10 md:right-30 md:left-300 z-20 bottom-10",
            "rounded-full border border-black/30 bg-white/90 backdrop-blur-sm",
            "px-4 py-2 font-alt text-sm font-semibold",
            "shadow-[0_10px_30px_rgba(0,0,0,0.20)]",
            "transition-all duration-200",
            showReturn
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none",
        ].join(" ")}
      >
        Return to This Week
      </button>
    </section>
  );
}
