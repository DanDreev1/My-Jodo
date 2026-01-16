"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAimsStore } from "@/stores/useAimsStore";
import { useMonthAims } from "@/hooks/aims/useAimsQueries";
import type { Aim } from "@/types/aim";
import { AimCard } from "@/components/aims/cards/AimCard";
import { useAimLinksForParents } from "@/hooks/aims/useAimLinksForParents";
import { computeMonthProgress } from "@/lib/aims/progress";

const STICKY_OFFSET_PX = 172;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmtMonthLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "short" });
}

export function MonthsView() {
  const router = useRouter();
  const anchorDate = useAimsStore((s) => s.anchorDate);
  const returnToToday = useAimsStore((s) => s.returnToToday);

  const year = anchorDate.getFullYear();
  const { data = [], isLoading } = useMonthAims(year);
  const aims = data as Aim[];

  const hasAny = aims.length > 0;

  const parentIds = useMemo(() => aims.map((a) => a.id), [aims]);
  const linksQ = useAimLinksForParents(parentIds);
  const links = linksQ.data ?? [];
  const linksReady = !!linksQ.data;

  // group by month
  const byMonth = useMemo(() => {
    const map = new Map<string, Aim[]>();
    for (const a of aims) {
      const d = new Date(a.end_at);
      const k = monthKey(d);
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => +new Date(a.end_at) - +new Date(b.end_at));
    }
    return map;
  }, [aims]);

  const keys = useMemo(() => [...byMonth.keys()].sort(), [byMonth]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => monthKey(today), [today]);

  const isCurrentYear = today.getFullYear() === year;

  // ✅ как в Days/Weeks: добавляем якорь "текущий месяц", даже если 0 aims
  const renderKeys = useMemo(() => {
    if (!isCurrentYear) return keys;
    const set = new Set(keys);
    set.add(todayKey);
    return [...set].sort();
  }, [keys, isCurrentYear, todayKey]);

  // ✅ фокус: если текущий год — всегда current month, иначе ближайший/последний
  const focusKey = useMemo(() => {
    if (renderKeys.length === 0) return null;
    if (isCurrentYear) return todayKey;

    // если не текущий год: старая логика "next else last"
    const next = renderKeys.find((k) => k > todayKey);
    return next ?? renderKeys[renderKeys.length - 1];
  }, [renderKeys, isCurrentYear, todayKey]);

  const refs = useRef(new Map<string, HTMLDivElement | null>());

  const setRef = (k: string) => (el: HTMLDivElement | null) => {
    refs.current.set(k, el);
  };

  const [focusVisible, setFocusVisible] = useState(true);
  const [scrollToFocusNonce, setScrollToFocusNonce] = useState(0);

  // ✅ 1) one-time auto scroll при маунте/смене года
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (!focusKey) return;

    const el = refs.current.get(focusKey);
    if (!el) return;

    didInitialScroll.current = true;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "auto", block: "start" }));
  }, [focusKey]);

  // ✅ сбрасываем one-time скролл при смене года (когда anchorDate меняется)
  useEffect(() => {
    didInitialScroll.current = false;
  }, [year]);

  // ✅ 2) наблюдаем focus элемент чтобы показывать/прятать кнопку
  useEffect(() => {
    if (!focusKey) return;
    const el = refs.current.get(focusKey);
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => setFocusVisible(entries[0]?.isIntersecting ?? true),
      {
        root: null,
        rootMargin: `-${STICKY_OFFSET_PX + 8}px 0px 0px 0px`,
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [focusKey]);

  // ✅ 3) smooth scroll по кнопке Return (nonce)
  useEffect(() => {
    if (!focusKey) return;
    const el = refs.current.get(focusKey);
    if (!el) return;

    // то самое “простое решение”, которое у тебя сработало
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [scrollToFocusNonce, focusKey]);

  const showReturn = (!isCurrentYear || !focusVisible);

  if (isLoading) {
    return <div className="px-4 md:px-8 py-6 font-alt opacity-70">Loading…</div>;
  }

  if (!hasAny) {
    // Если год не текущий и aims нет — реально пусто
    return (
      <section className="bg-[#FFF7F0]">
        <div className="px-4 md:px-8 py-16 text-center">
          <div className="font-alt text-xl font-semibold text-[#251c16]">No aims yet.</div>
          <div className="mt-2 text-sm opacity-70">Create your first aim to start tracking your progress.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#FFF7F0]">
      <div className="px-4 md:px-8 py-6">
        <div className="space-y-6">
          {renderKeys.map((k) => {
            const [y, m] = k.split("-").map(Number);
            const monthDate = new Date(y, m - 1, 1);
            const list = byMonth.get(k) ?? [];

            const isTodayMonth = isCurrentYear && k === todayKey;

            // ✅ как в Days/Weeks: если пусто и это НЕ текущий месяц — не рендерим
            if (list.length === 0 && !isTodayMonth) return null;

            return (
              <div key={k} ref={setRef(k)} className="relative">
                <div className="flex gap-3 md:gap-4">
                  <div
                    className={[
                      "shrink-0 font-alt font-semibold text-[#251c16]",
                      "w-8 mx-2 md:mx-0 text-[13px]",
                      "sm:w-20 sm:text-[14px]",
                      "md:w-24 md:text-[16px]",
                      "flex flex-col items-center md:items-start gap-2 text-center md:text-start"
                    ].join(" ")}
                  >
                    {fmtMonthLabel(monthDate)}
                    {isTodayMonth ? (
                      <span className="inline-flex rounded-full bg-[#251c16]/10 px-2 py-0.5 text-[10px] font-semibold">
                        This month
                      </span>
                    ) : null}
                  </div>

                  <div className="flex-1 space-y-3">
                    {list.length ? (
                      list.map((aim) => {
                        const computed = linksReady
                          ? computeMonthProgress(aim.id, links as any, 3)
                          : { progress: 0, doneUnits: 0, totalUnits: 3, isComplete: false };

                        return (
                          <AimCard
                            key={aim.id}
                            aim={aim}
                            levelForStripe="month"
                            showProgress
                            progressOverride={computed.progress}
                            progressMeta={`${computed.doneUnits}/${computed.totalUnits} weeks`}
                            onEdit={() => router.push(`/aims/${aim.id}/edit`)}
                            doneOverride={computed.isComplete}
                          />
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm opacity-70">
                        No aims for this month yet.
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
          showReturn ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none",
        ].join(" ")}
      >
        Return to This Month
      </button>
    </section>
  );
}