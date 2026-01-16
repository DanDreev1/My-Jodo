"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const VERIFY_TIMEOUT_MS = 1200;

export function useProfileUser() {
  return useQuery({
    queryKey: ["profile", "user"],
    networkMode: "always", // важно: чтобы не зависало в "paused" при offline/нестабильной сети
    queryFn: async () => {
      const supabase = createClient();

      // 1) Быстро и локально (не сеть)
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const sessionUser = sessionData.session?.user ?? null;
      if (!sessionUser) return null;

      // 2) Опциональная валидация по сети, но с тайм-аутом (UI не ждёт бесконечно)
      const verifyPromise = supabase.auth.getUser().then(({ data, error }) => {
        if (error) return sessionUser;
        return data.user ?? sessionUser;
      });

      const timedFallback = new Promise<typeof sessionUser>((resolve) =>
        window.setTimeout(() => resolve(sessionUser), VERIFY_TIMEOUT_MS)
      );

      return await Promise.race([verifyPromise, timedFallback]);
    },
    staleTime: 60_000,
    retry: 1,
  });
}