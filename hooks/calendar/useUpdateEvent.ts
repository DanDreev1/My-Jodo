import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, EventTag } from "@/types/event";

type UpdateEventInput = {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location?: string | null;
  tag?: EventTag | null;
};

export function useUpdateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEventInput) => {
      const supabase = createClient();

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userRes.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .update({
          title: input.title,
          description: input.description ?? null,
          start_at: input.start_at,
          end_at: input.end_at ?? null,
          location: input.location ?? null,
          tag: input.tag ?? null,
        })
        .eq("id", input.id)
        .eq("user_id", userRes.user.id)
        .select("*")
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["events"], exact: false });
      qc.invalidateQueries({ queryKey: ["event", updated.id], exact: true });
      // опционально: сразу обновить кэш точечно
      qc.setQueryData(["event", updated.id], updated);
    },
  });
}