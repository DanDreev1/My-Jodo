import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/types/event";

export function useEventById(id?: string) {
  return useQuery({
    queryKey: ["event", id],
    enabled: !!id && id !== "undefined",
    queryFn: async () => {
      const supabase = createClient();

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userRes.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .eq("user_id", userRes.user.id)
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
  });
}