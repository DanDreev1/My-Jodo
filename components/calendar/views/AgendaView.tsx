"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useAgendaInfiniteEvents } from "@/hooks/calendar/useAgendaInfiniteEvents";
import type { CalendarEvent } from "@/types/event";
import { AgendaEventCard } from "@/components/calendar/AgendaEventCard";
import { useAuthStore } from "@/stores/useAuthStore";

const STICKY_OFFSET_PX = 172; // Topbar 80 + Controls ~92

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtAgendaDay(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function sortDayKeys(keys: string[]) {
  return keys.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function AgendaView() {

  const userId = useAuthStore((s) => s.userId);

  // anchorDate пока оставим как “центр”
  const anchorDate = useCalendarStore((s) => s.anchorDate);

  const q = useAgendaInfiniteEvents(startOfDay(anchorDate));

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => dayKeyLocal(today), [today]);

  const {
    data,
    isLoading,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useAgendaInfiniteEvents(startOfDay(anchorDate));

  // flatten events из всех страниц
  const allEvents: CalendarEvent[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const out = (data?.pages ?? []).flatMap((p) => p.events);
    out.sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    return out;
  }, [data]);

  // group by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of allEvents) {
      const d = new Date(ev.start_at);
      const k = dayKeyLocal(d);
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    }
    return map;
  }, [allEvents]);

  const dayKeys = useMemo(() => sortDayKeys([...eventsByDay.keys()]), [eventsByDay]);

  // --- choose initial focus day:
  // 1) today if exists
  // 2) next day after today that exists
  // 3) last existing day
  const focusKey = useMemo(() => {
    if (dayKeys.length === 0) return null;
    if (eventsByDay.has(todayKey)) return todayKey;

    const next = dayKeys.find((k) => k > todayKey);
    if (next) return next;

    return dayKeys[dayKeys.length - 1];
  }, [dayKeys, eventsByDay, todayKey]);

  // refs for scroll targets
  const dayRefs = useRef(new Map<string, HTMLDivElement | null>());
  const setDayRef = (k: string) => (el: HTMLDivElement | null) => {
    dayRefs.current.set(k, el);
  };

  // show/hide "Return to Today"
  const [showReturn, setShowReturn] = useState(false);

  // sentinel refs (doom scrolling)
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  // 1) Auto-scroll to focus day on first meaningful load
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (!focusKey) return;
    const el = dayRefs.current.get(focusKey);
    if (!el) return;

    didInitialScroll.current = true;

    // обновим anchorDate на этот фокусный день (чтобы label/логика совпадали)
    const [y, m, d] = focusKey.split("-").map(Number);
    const focusDate = new Date(y, m - 1, d, 0, 0, 0, 0);

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [focusKey]);

  // 2) Return button visibility: если focus-day ушёл из вида — показываем кнопку
  useEffect(() => {
    if (!focusKey) return;
    const el = dayRefs.current.get(focusKey);
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowReturn(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: `-${STICKY_OFFSET_PX + 8}px 0px 0px 0px`,
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [focusKey]);

  const nextLockRef = useRef(false);
  const prevLockRef = useRef(false);

// вниз
  useEffect(() => {
    const el = bottomSentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(async ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (!hasNextPage || isFetchingNextPage) return;
        if (nextLockRef.current) return;

        nextLockRef.current = true;
        try {
        await fetchNextPage();
        } finally {
        setTimeout(() => (nextLockRef.current = false), 250);
        }
    }, { root: null, rootMargin: "200px 0px", threshold: 0.01 });

    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // вверх
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(async ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (!hasPreviousPage || isFetchingPreviousPage) return;
        if (prevLockRef.current) return;

        prevLockRef.current = true;

        // чтобы не прыгало при добавлении сверху
        const prevHeight = document.documentElement.scrollHeight;
        const prevY = window.scrollY;

        try {
        await fetchPreviousPage();
        } finally {
        requestAnimationFrame(() => {
            const newHeight = document.documentElement.scrollHeight;
            window.scrollTo({ top: prevY + (newHeight - prevHeight) });
        });
        setTimeout(() => (prevLockRef.current = false), 250);
        }
    }, { root: null, rootMargin: "200px 0px", threshold: 0.01 });

    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPreviousPage, hasPreviousPage, isFetchingPreviousPage]);

  const scrollToFocus = () => {
    if (!focusKey) return;
    const el = dayRefs.current.get(focusKey);
    if (!el) return;

    // anchorDate обновляем на этот фокусный день
    const [y, m, d] = focusKey.split("-").map(Number);
    const focusDate = new Date(y, m - 1, d, 0, 0, 0, 0);

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const didWarmup = useRef(false);
  const hasAnyEvents = allEvents.length > 0;

  // --- WARMUP: добрать контент на 1–2 экрана ---
  const warmupDoneRef = useRef(false);
  const warmupStepsRef = useRef(0);

  const WARMUP_MAX_STEPS = 6;
  const WARMUP_MIN_HEIGHT = 1.6;

  function contentTallEnough() {
    const h = document.documentElement.scrollHeight;
    const vh = window.innerHeight || 800;
    return h >= vh * WARMUP_MIN_HEIGHT;
  }

  useEffect(() => {
    // стартуем когда уже есть хоть какой-то контент и не идёт загрузка
    if (warmupDoneRef.current) return;
    if (isLoading) return;

    // если и так хватает — стоп
    if (contentTallEnough()) {
        warmupDoneRef.current = true;
        return;
    }

    // защита от бесконечности
    if (warmupStepsRef.current >= WARMUP_MAX_STEPS) {
        warmupDoneRef.current = true;
        return;
    }

    // если грузить уже некуда — стоп
    const canPrev = hasPreviousPage && !isFetchingPreviousPage;
    const canNext = hasNextPage && !isFetchingNextPage;

    if (!canPrev && !canNext) {
        warmupDoneRef.current = true;
        return;
    }

    // 👇 делаем один “шаг”: сначала вверх, потом вниз (или наоборот, если вверх нельзя)
    (async () => {
        warmupStepsRef.current += 1;

        // 1) prev (если можно)
        if (canPrev) {
        const prevHeight = document.documentElement.scrollHeight;
        const prevY = window.scrollY;

        await fetchPreviousPage();

        // компенсируем прыжок
        requestAnimationFrame(() => {
            const newHeight = document.documentElement.scrollHeight;
            window.scrollTo({ top: prevY + (newHeight - prevHeight) });
        });
        }

        // 2) next (если можно)
        if (canNext) {
        await fetchNextPage();
        }

        // после шага дадим DOM’у дорендериться и проверим снова
        requestAnimationFrame(() => {
        if (contentTallEnough() || warmupStepsRef.current >= WARMUP_MAX_STEPS) {
            warmupDoneRef.current = true;
        }
        });
    })();
  }, [
    isLoading,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    allEvents.length,
  ]);

  useEffect(() => {
    warmupDoneRef.current = false;
    warmupStepsRef.current = 0;
  }, [anchorDate]);

  const isFetched = !!data;

  if (!isLoading && isFetched && allEvents.length === 0) {
    return (
        <section className="relative bg-[#FFF7F0]">
        <div className="px-4 md:px-8 py-16 text-center">
            <div className="font-alt text-xl font-semibold text-[#251c16]">
            No events yet.
            </div>
            <div className="mt-2 text-sm opacity-70">
            Add your first event to see it here.
            </div>
        </div>
        </section>
    );
  }

  return (
    <section className="relative bg-[#FFF7F0]">
      {/* sentinel top */}
      <div ref={topSentinelRef} className="h-2 w-full" />

      {/* content */}
      <div className="px-4 md:px-8 py-6">
        <div className="space-y-6">
            {!hasAnyEvents ? (
                <div className="p-6 text-center">
                    <div className="font-alt text-lg font-semibold text-[#251c16]">
                        No events yet
                    </div>
                    <div className="mt-1 text-sm opacity-70">
                        Create your first event to see it here.
                    </div>
                </div>
            ) : (
            dayKeys.map((k) => {
                const [y, m, d] = k.split("-").map(Number);
                const date = new Date(y, m - 1, d, 0, 0, 0, 0);
                const list = eventsByDay.get(k) ?? [];

                // если вдруг пусто — не рисуем (но по идее dayKeys уже только с эвентами)
                if (list.length === 0) return null;

                return (
                <div key={k} ref={setDayRef(k)} className="relative">
                    {/* row: left label + right cards */}
                    <div className="flex gap-3 md:gap-4">
                    {/* left date label */}
                    <div
                    className={[
                        "shrink-0 font-alt font-semibold text-[#251c16]",
                        // mobile: уже
                        "w-16 text-[13px]",
                        // tablet/desktop: шире
                        "sm:w-20 sm:text-[14px]",
                        "md:w-24 md:text-[16px]",
                    ].join(" ")}
                    >
                        {fmtAgendaDay(date)}
                    </div>

                    {/* right list */}
                    <div className="flex-1 space-y-3">
                        {list.map((ev) => (
                            <div key={ev.id} className="relative">
                                <AgendaEventCard
                                    event={ev}
                                />
                            </div>
                        ))}
                    </div>
                    </div>

                    {/* divider between days */}
                    <div className="mt-6 h-px bg-black/10" />
                </div>
                );
            })
          )}
        </div>
      </div>

      {/* sentinel bottom */}
      <div ref={bottomSentinelRef} className="h-10 w-full" />

      {/* Return to Today (actually returns to focus day: today if exists else next else last) */}
      {showReturn && focusKey && (
        <button
          type="button"
          onClick={scrollToFocus}
          className={[
            "fixed right-5 z-20",
            "bottom-24 md:bottom-8",
            "rounded-full border border-black/30 bg-white/90 backdrop-blur-sm",
            "px-4 py-2 font-alt text-sm font-semibold",
            "shadow-[0_10px_30px_rgba(0,0,0,0.20)]",
            "hover:bg-white transition",
          ].join(" ")}
        >
          Return to Today
        </button>
      )}
    </section>
  );
}