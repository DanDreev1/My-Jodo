"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

function deriveNickname(user: any) {
  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const fromMeta =
    meta.nickname || meta.username || meta.display_name || meta.full_name;

  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();

  const email = user?.email as string | undefined;
  if (email && email.includes("@")) return email.split("@")[0];

  return "User";
}

const QK = ["profile-identity"] as const;

export function useProfileIdentity() {
  const supabase = useMemo(() => createClient(), []);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const user = data.session?.user ?? null;
      return {
        user,
        nickname: deriveNickname(user),
        email: user?.email ?? "",
      };
    },
    staleTime: 30_000,
  });

  // ✅ держим синхронизацию при логине/логауте/смене сессии
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: QK });
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, qc]);

  return {
    loading: q.isLoading,
    user: q.data?.user ?? null,
    nickname: q.data?.nickname ?? "User",
    email: q.data?.email ?? "",
    refresh: () => qc.invalidateQueries({ queryKey: QK }), // ✅ теперь это не надо прокидывать пропсом
  };
}