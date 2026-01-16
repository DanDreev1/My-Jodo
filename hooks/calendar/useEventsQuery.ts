import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/types/event";

type Range = { from: Date; to: Date };

function toIso(d: Date) {
  return d.toISOString();
}

export function useEventsQuery(range: Range) {
  return useQuery({
    queryKey: ["events", toIso(range.from), toIso(range.to)],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_at", range.from.toISOString())
        .lt("start_at", range.to.toISOString())
        .order("start_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}
