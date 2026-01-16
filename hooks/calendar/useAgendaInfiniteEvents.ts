import { useInfiniteQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "@/types/event";
import { useAuthStore } from "@/stores/useAuthStore";

type PageParam = { from: Date; to: Date };

type RangeResponse = {
  events: CalendarEvent[];
  hasPrev: boolean;
  hasNext: boolean;
};

function startOfUTCDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

function toIso(d: Date) {
  return d.toISOString();
}

function makeUrl(from: Date, to: Date) {
  return `/api/events/range?from=${encodeURIComponent(toIso(from))}&to=${encodeURIComponent(toIso(to))}`;
}

async function fetchRange(from: Date, to: Date): Promise<RangeResponse> {
  const res = await fetch(makeUrl(from, to));
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Failed to load agenda events");
  return json as RangeResponse;
}

export function useAgendaInfiniteEvents(anchorDayLocal: Date) {
  const userId = useAuthStore((s) => s.userId);
  const WINDOW_DAYS = 14;
  const HALF = WINDOW_DAYS / 2; // 7

  const anchorDay = startOfUTCDay(anchorDayLocal);
  const initialFrom = addDaysUTC(anchorDay, -HALF);
  const initialTo = addDaysUTC(anchorDay, +HALF);

  return useInfiniteQuery({
    // ✅ ВАЖНО: ключ зависит от anchorDay, иначе при смене якоря будут странности
    queryKey: ["agenda-events", userId, anchorDay.toISOString().slice(0, 10)],
    enabled: !!userId,

    initialPageParam: { from: initialFrom, to: initialTo },

    queryFn: ({ pageParam }) => fetchRange(pageParam.from, pageParam.to),

    // ✅ next window: только если API говорит что дальше есть
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage.hasNext) return undefined;
      return {
        from: lastPageParam.to,
        to: addDaysUTC(lastPageParam.to, WINDOW_DAYS),
      };
    },

    // ✅ prev window: только если API говорит что раньше есть
    getPreviousPageParam: (firstPage, _allPages, firstPageParam) => {
      if (!firstPage.hasPrev) return undefined;
      return {
        from: addDaysUTC(firstPageParam.from, -WINDOW_DAYS),
        to: firstPageParam.from,
      };
    },

    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}