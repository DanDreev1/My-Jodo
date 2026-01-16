"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

type AimLinkRow = {
  parent_id: string;
  child: {
    id: string;
    end_at: string;
    status: string;
    level: string;
  }[];
};

export function useAimLinksForParents(parentIds: string[]) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    // ✅ user-scoped key
    queryKey: [
      "aim_links",
      userId,
      "parents",
      parentIds.join(","),
    ],

    // ✅ не дергаем без userId и без parentIds
    enabled: !!userId && parentIds.length > 0,

    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("aim_links")
        .select(
          `parent_id, child:child_id (id, end_at, status, level)`
        )
        .in("parent_id", parentIds);

      if (error) throw error;

      return (data ?? []) as AimLinkRow[];
    },
  });
}
