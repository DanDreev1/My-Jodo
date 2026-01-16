"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useProfileAvatar(userId: string | null) {
  return useQuery({
    queryKey: ["profile", "avatar", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_path, avatar_version, avatar_updated_at")
        .eq("id", userId!)
        .maybeSingle();

      if (error) throw error;

      return {
        avatar_path: data?.avatar_path ?? null,
        avatar_version: data?.avatar_version ?? 0,
        avatar_updated_at: data?.avatar_updated_at ?? null,
      };
    },
  });
}