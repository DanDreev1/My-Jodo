"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { NoteRow } from "@/types/note";

export function useNotes() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery<NoteRow[]>({
    queryKey: ["notes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("notes")
        .select("id,user_id,type,title,payload,x,y,created_at,updated_at")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as NoteRow[];
    },
  });
}

export function useNote(noteId?: string) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery<NoteRow | null>({
    queryKey: ["note", userId, noteId],
    enabled: !!userId && !!noteId,
    queryFn: async () => {
      if (!noteId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("notes")
        .select("id,user_id,type,title,payload,x,y,created_at,updated_at")
        .eq("id", noteId)
        .eq("user_id", userId!)
        .single();

      if (error) throw error;
      return data as NoteRow;
    },
  });
}