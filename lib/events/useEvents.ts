"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/types/event";

type ApiResponse = { events: CalendarEvent[] };

export function useEvents(from: Date, to: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = useMemo(
    () => `${from.toISOString()}__${to.toISOString()}`,
    [from, to]
  );

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });

      try {
        const res = await fetch(`/api/events?${qs.toString()}`, {
          signal: ac.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error ?? `Request failed (${res.status})`);
        }

        const json = (await res.json()) as ApiResponse;
        setEvents(json?.events ?? []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setEvents([]);
        setError(e?.message ? String(e.message) : "Failed to load events");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [key]);

  return { events, loading, error };
}