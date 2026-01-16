import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EventTag } from "@/types/event";
import { DEFAULT_TAG } from "@/lib/eventTags";

type CreateEventInput = {
  title: string;
  description?: string;
  start_at: string;
  end_at?: string | null;
  location?: string;
  tag?: EventTag; // <-- вместо color
};

export function useCreateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const supabase = createClient();

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userRes.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("events").insert({
        user_id: userRes.user.id,
        title: input.title,
        description: input.description ?? null,
        start_at: input.start_at,
        end_at: input.end_at ?? null,
        all_day: false,
        location: input.location ?? null,
        tag: input.tag ?? DEFAULT_TAG,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"], exact: false });
    },
  });
}