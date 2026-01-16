"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthCacheGuard() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const resetAuth = useAuthStore((s) => s.reset);

  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // initial user (page reload)
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      lastUserIdRef.current = u?.id ?? null;
      setUser(u?.id ?? null, u?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const nextId = session?.user?.id ?? null;

      // ✅ logout
      if (!nextId) {
        qc.clear();
        lastUserIdRef.current = null;
        resetAuth();
        return;
      }

      // ✅ user реально поменялся (или был null -> появился)
      if (lastUserIdRef.current !== nextId) {
        qc.clear();
        lastUserIdRef.current = nextId;
        setUser(nextId, session?.user?.email ?? null);
        return;
      }

      // ✅ тот же пользователь (часто INITIAL_SESSION / TOKEN_REFRESH) — НЕ трогаем кэш
      // иначе ты сам себе сносишь данные после успешного ответа
    });

    return () => sub.subscription.unsubscribe();
  }, [qc, resetAuth, setUser]);

  return null;
}