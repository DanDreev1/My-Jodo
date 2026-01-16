"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { NoteRow } from "@/types/note";

export function useUpdateNotePosition() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: async (args: { id: string; x: number; y: number }) => {
      const supabase = createClient();

      const { error } = await supabase
        .from("notes")
        .update({ x: args.x, y: args.y })
        .eq("id", args.id)
        .eq("user_id", userId!);

      if (error) throw error;
      return true;
    },

    // optimistic update: сразу двигаем в кэше
    onMutate: async (args) => {
      if (!userId) return;

      const key = ["notes", userId] as const;
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData<NoteRow[]>(key);

      qc.setQueryData<NoteRow[]>(key, (old) =>
        (old ?? []).map((n) => (n.id === args.id ? { ...n, x: args.x, y: args.y } : n))
      );

      return { prev, key };
    },

    onError: (_err, _args, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },

    // после апдейта можно не invalidate (мы уже обновили кэш)
    // но на всякий случай можно оставить мягкую синхронизацию:
    onSettled: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["notes", userId] });
    },
  });
}