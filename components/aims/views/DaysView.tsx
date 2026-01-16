"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAimsStore } from "@/stores/useAimsStore";
import { useDayAims } from "@/hooks/aims/useAimsQueries";
import type { Aim } from "@/types/aim";
import { AimCard } from "@/components/aims/cards/AimCard";
import { createClient } from "@/lib/supabase/client";
import { computeWeekProgress } from "@/lib/aims/progress";
import { computeMonthProgress } from "@/lib/aims/progress";
import { useAuthStore } from "@/stores/useAuthStore";

const STICKY_OFFSET_PX = 172;

function wIndexFromDate(d: Date) {
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}
function wStartDay(w: number) {
  return w === 1 ? 1 : w === 2 ? 8 : w === 3 ? 15 : 22;
}
function wEndDay(year: number, monthIndex0: number, w: number) {
  if (w === 1) return 7;
  if (w === 2) return 14;
  if (w === 3) return 21;
  return new Date(year, monthIndex0 + 1, 0).getDate();
}
function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtDayLabel(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function DaysView() {
  const userId = useAuthStore((s) => s.userId);
  const anchorDate = useAimsStore((s) => s.anchorDate); // start of W block
  const returnToToday = useAimsStore((s) => s.returnToToday);
  const router = useRouter();

  const year = anchorDate.getFullYear();
  const monthIndex0 = anchorDate.getMonth();
  const w = wIndexFromDate(anchorDate);

  const { data = [], isLoading } = useDayAims(year, monthIndex0);
  const aimsAll = data as Aim[];

  const aimsInW = useMemo(() => {
    return aimsAll.filter((a) => wIndexFromDate(new Date(a.end_at)) === w);
  }, [aimsAll, w]);

  const [savingId, setSavingId] = useState<string | null>(null);

  const hasAnyInMonth = aimsAll.length > 0;

  // group by day (only days with aims)
  const byDay = useMemo(() => {
    const map = new Map<string, Aim[]>();
    for (const a of aimsInW) {
      const d = new Date(a.end_at);
      const k = dayKey(d);
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => +new Date(a.end_at) - +new Date(b.end_at));
    }
    return map;
  }, [aimsInW]);

  const dayKeys = useMemo(() => [...byDay.keys()].sort(), [byDay]);

  // focus: today day (if in this month + this W + has aims), else first day with aims
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dayKey(today), [today]);

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex0;
  const isCurrentW = isCurrentMonth && wIndexFromDate(today) === w;

  const renderKeys = useMemo(() => {
    if (!isCurrentW) return dayKeys;
    const set = new Set(dayKeys);
    set.add(todayKey); // добавляем якорь today даже если там 0 aims
    return [...set].sort();
  }, [dayKeys, isCurrentW, todayKey]);

  const focusKey = useMemo(() => {
    if (renderKeys.length === 0) return null;
    if (isCurrentW) return todayKey;
    return renderKeys[0];
  }, [renderKeys, isCurrentW, todayKey]);

  const refs = useRef(new Map<string, HTMLDivElement | null>());

  const setRef = (k: string) => (el: HTMLDivElement | null) => {
    refs.current.set(k, el);
  };
  
  const [focusVisible, setFocusVisible] = useState(true);

  const [scrollToFocusNonce, setScrollToFocusNonce] = useState(0);

  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (!focusKey) return;
    const el = refs.current.get(focusKey);
    if (!el) return;

    didInitialScroll.current = true;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [focusKey]);

  useEffect(() => {
    if (!focusKey) return;

    const el = refs.current.get(focusKey);
    if (!el) return;

    const obs = new IntersectionObserver(
        (entries) => {
        setFocusVisible(entries[0]?.isIntersecting ?? true);
        },
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
  }, [scrollToFocusNonce, focusKey]);

  useEffect(() => {
    didInitialScroll.current = false;
  }, [year, monthIndex0, w]);

  const showReturn = (!isCurrentW || !focusVisible);

  // ---- status mutation (Finish / Not Finish) ----
  const qc = useQueryClient();

  const setDayStatus = useMutation({
    mutationFn: async (args: { id: string; status: "done" | "not_done" }) => {
        const supabase = createClient();

        // 1) обновляем day aim
        const dayProgress = args.status === "done" ? 100 : 0;

        const { error: dayErr } = await supabase
            .from("aims")
            .update({ status: args.status, progress: dayProgress })
            .eq("id", args.id);

        if (dayErr) throw dayErr;

        // 2) находим родителя-week (если есть)
        const { data: linkRow, error: linkErr } = await supabase
            .from("aim_links")
            .select("parent_id")
            .eq("child_id", args.id)
            .maybeSingle();

        if (linkErr) throw linkErr;

        const parentWeekId = linkRow?.parent_id;
        if (!parentWeekId) {
            // day aim не привязана к week — нечего пересчитывать
            return { parentWeekId: null as string | null };
        }

        // 3) берём всех day детей этой недели
        const { data: links, error: linksErr } = await supabase
            .from("aim_links")
            .select(`parent_id, child:child_id (id, end_at, status, level)`)
            .eq("parent_id", parentWeekId);

        if (linksErr) throw linksErr;

        // 4) считаем прогресс недели (по дням)
        const computed = computeWeekProgress(parentWeekId, (links ?? []) as any, 5);

        // 5) апдейтим родительскую week aim
        const weekStatus = computed.isComplete ? "done" : "active";
        const { error: weekErr } = await supabase
            .from("aims")
            .update({ status: weekStatus, progress: computed.progress })
            .eq("id", parentWeekId);

        if (weekErr) throw weekErr;

        // 6) пытаемся найти parent-month для этой week (если week привязана к month)
        const { data: monthLink, error: monthLinkErr } = await supabase
            .from("aim_links")
            .select("parent_id")
            .eq("child_id", parentWeekId)
            .maybeSingle();

        if (monthLinkErr) throw monthLinkErr;

        const parentMonthId = monthLink?.parent_id;
        if (!parentMonthId) {
            // week не привязана к month — нечего пересчитывать
            return { parentWeekId, parentMonthId: null as string | null };
        }

        // 7) тянем всех week детей у месяца
        const { data: monthLinks, error: monthLinksErr } = await supabase
            .from("aim_links")
            .select(`parent_id, child:child_id (id, end_at, status, level)`)
            .eq("parent_id", parentMonthId);

        if (monthLinksErr) throw monthLinksErr;

        // 8) считаем прогресс месяца (по done weeks)
        const monthComputed = computeMonthProgress(parentMonthId, (monthLinks ?? []) as any, 3);

        // 9) апдейтим month aim
        const monthStatus = monthComputed.isComplete ? "done" : "active";
        const { error: monthErr } = await supabase
            .from("aims")
            .update({ status: monthStatus, progress: monthComputed.progress })
            .eq("id", parentMonthId);

        if (monthErr) throw monthErr;

        return { parentWeekId, parentMonthId };
    },
    onMutate: async (args) => {
        setSavingId(args.id);
        if (!userId) return;

        const dayKey = ["aims", userId, "day", year, monthIndex0] as const;

        // остановим возможные рефетчи, чтобы не перезатёрли optimistic
        await qc.cancelQueries({ queryKey: dayKey });

        // снимок старых данных, чтобы откатить при ошибке
        const prev = qc.getQueryData<Aim[]>(dayKey);

        // применяем optimistic update
        qc.setQueryData<Aim[]>(dayKey, (old) =>
            (old ?? []).map((a) =>
                a.id === args.id
                ? {
                    ...a,
                    status: args.status,
                    progress: args.status === "done" ? 100 : 0,
                    }
                : a
            )
        );

    return { prev, dayKey, id: args.id };
  },

  // ✅ 2) Если сервер упал — откатываем
  onError: (_err, _args, ctx) => {
    if (ctx?.prev && ctx?.dayKey) {
      qc.setQueryData(ctx.dayKey, ctx.prev);
    }
  },

  // ✅ 3) После завершения (успех/ошибка) — синхронизируем все уровни
  onSettled: (_data, _err, _args, ctx) => {
    setSavingId((cur) => (cur === ctx?.id ? null : cur));
    if (!userId) return;

    qc.invalidateQueries({ queryKey: ["aims", userId, "day", year, monthIndex0] });
    qc.invalidateQueries({ queryKey: ["aims", userId, "week", year, monthIndex0] });
    qc.invalidateQueries({ queryKey: ["aims", userId, "month", year] });

    // ⚠️ ВАЖНО: только если ты реально перевёл aim_links на userId в queryKey
    qc.invalidateQueries({ queryKey: ["aim_links", userId] });
  },
  });

  // ---------- empty states ----------
  if (isLoading) {
    return <div className="px-4 md:px-8 py-6 font-alt opacity-70">Loading…</div>;
  }

  if (!hasAnyInMonth) {
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

  if (aimsInW.length === 0) {
    const start = wStartDay(w);
    const end = wEndDay(year, monthIndex0, w);
    const mon = new Date(year, monthIndex0, 1).toLocaleDateString("en-GB", { month: "short" });

    return (
      <section className="bg-[#FFF7F0]">
        <div className="px-4 md:px-8 py-16 text-center">
          <div className="font-alt text-xl font-semibold text-[#251c16]">
            No aims for W{w} ({String(start).padStart(2, "0")}–{String(end).padStart(2, "0")} {mon}).
          </div>
          <div className="mt-2 text-sm opacity-70">
            Add a day aim to start filling this week.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#FFF7F0]">
      <div className="px-4 md:px-8 py-6">
        <div className="space-y-6">
          {renderKeys.map((k) => {
            const [yy, mm, dd] = k.split("-").map(Number);
            const date = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
            const list = byDay.get(k) ?? [];

            const isTodayBlock = isCurrentW && k === todayKey;

            if (list.length === 0 && !isTodayBlock) return null;

            return (
              <div key={k} ref={setRef(k)} className="relative">
                <div className="flex gap-3 md:gap-4">
                  <div className="shrink-0 font-alt font-semibold text-[#251c16] w-12 text-[13px] sm:w-12 sm:text-[14px] md:w-32 md:text-[16px] flex flex-col items-start gap-3 text-center md:text-start">
                    {fmtDayLabel(date)}
                    {isTodayBlock ? (
                        <span className="md:mt-0 inline-flex rounded-full bg-[#251c16]/10 px-2 py-0.5 text-[10px] font-semibold">
                        Today
                        </span>
                    ) : null}
                  </div>

                  {/* right cards */}
                  <div className="flex-1 space-y-3">
                    {list.length ? (
                        list.map((aim) => {
                            const isDone = aim.status === "done";
                            const isNot = aim.status === "not_done";

                            return (
                            <AimCard
                                key={`${aim.id}:${aim.status}:${aim.progress}`}
                                aim={aim}
                                levelForStripe="day"
                                showProgress={false}
                                onEdit={() => router.push(`/aims/${aim.id}/edit`)}
                                doneOverride={isDone}
                                footer={
                                <div className="flex items-center gap-3">
                                    <button
                                    type="button"
                                    onClick={() => setDayStatus.mutate({ id: aim.id, status: "done" })}
                                    className={[
                                        "px-4 py-2 rounded-full font-alt text-[10px] md:text-sm font-semibold",
                                        "border border-black/25 bg-white",
                                        isNot ? "opacity-100" : "opacity-80 hover:opacity-100",
                                    ].join(" ")}
                                    aria-pressed={isDone}
                                    >
                                    Finish
                                    </button>

                                    <button
                                    type="button"
                                    onClick={() => setDayStatus.mutate({ id: aim.id, status: "not_done" })}
                                    className={[
                                        "px-4 py-2 rounded-full font-alt text-[10px] md:text-sm font-semibold",
                                        "border border-black/25 bg-white",
                                        isNot ? "opacity-100" : "opacity-80 hover:opacity-100",
                                    ].join(" ")}
                                    aria-pressed={isNot}
                                    >
                                    Not Finish
                                    </button>

                                    {savingId === aim.id ? (
                                    <span className="text-xs opacity-60">Saving…</span>
                                    ) : null}
                                </div>
                                }
                            />
                            );
                        })
                        ) : (
                        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm opacity-70">
                            No aims for today yet.
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
        Return to Today
      </button>
    </section>
  );
}
