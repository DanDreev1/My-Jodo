"use client";

import { useQuery } from "@tanstack/react-query";
import type { Aim } from "@/types/aim";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

function yearRange(year: number) {
  const from = new Date(year, 0, 1, 0, 0, 0, 0);
  const to = new Date(year + 1, 0, 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

function monthRange(year: number, monthIndex0: number) {
  const from = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const to = new Date(year, monthIndex0 + 1, 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

function startOfYearISO(year: number) {
  return new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
}
function endOfYearISO(year: number) {
  return new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
}

export function useYearAims(year: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ["aims", userId, "year", year],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("aims")
        .select("*")
        .eq("level", "year")
        .gte("end_at", startOfYearISO(year))
        .lte("end_at", endOfYearISO(year))
        .order("end_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Aim[];
    },
  });
}

export function useMonthAims(year: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ["aims", userId, "month", year],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient();
      const { from, to } = yearRange(year);

      const { data, error } = await supabase
        .from("aims")
        .select("*")
        .eq("level", "month")
        .gte("end_at", from)
        .lt("end_at", to)
        .order("end_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Aim[];
    },
  });
}

export function useWeekAims(year: number, monthIndex0: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ["aims", userId, "week", year, monthIndex0],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient();
      const { from, to } = monthRange(year, monthIndex0);

      const { data, error } = await supabase
        .from("aims")
        .select("*")
        .eq("level", "week")
        .gte("end_at", from)
        .lt("end_at", to)
        .order("end_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Aim[];
    },
  });
}

export function useDayAims(year: number, monthIndex0: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ["aims", userId, "day", year, monthIndex0],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient();
      const { from, to } = monthRange(year, monthIndex0);

      const { data, error } = await supabase
        .from("aims")
        .select("*")
        .eq("level", "day")
        .gte("end_at", from)
        .lt("end_at", to)
        .order("end_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Aim[];
    },
  });
}