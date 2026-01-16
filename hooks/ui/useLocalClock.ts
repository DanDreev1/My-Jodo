"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function useLocalClock() {
  const [now, setNow] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());

    tick(); // первый клиентский рендер

    const msToNextMinute =
      (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();

    timeoutRef.current = window.setTimeout(() => {
      tick();
      intervalRef.current = window.setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const ready = now !== null;

  return {
    ready,
    timeLabel: now ? formatTime(now) : "",
    dateLabel: now ? formatDate(now) : "",
    tz,
  };
}