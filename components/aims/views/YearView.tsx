"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAimsStore } from "@/stores/useAimsStore";
import { useYearAims } from "@/hooks/aims/useAimsQueries";
import type { Aim } from "@/types/aim";
import { AimCard } from "@/components/aims/cards/AimCard";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

const STICKY_OFFSET_PX = 172;

function yearKey(d: Date) {
  return String(d.getFullYear());
}

export function YearView() {
  const userId = useAuthStore((s) => s.userId);
  const anchorDate = useAimsStore((s) => s.anchorDate);
  const returnToToday = useAimsStore((s) => s.returnToToday);
  const router = useRouter();

  const year = anchorDate.getFullYear();

  const { data = [], isLoading } = useYearAims(year);
  const aims = data as Aim[];

  const hasAny = aims.length > 0;

  // focus: если есть цели в текущем году — скроллим к первой, иначе просто вверх
  const today = useMemo(() => new Date(), []);
  const todayY = useMemo(() => yearKey(today), [today]);

  // выберем фокус: первая цель этого года (или null)
  const focusId = useMemo(() => {
    if (aims.length === 0) return null;
    // если это текущий год — попробуем найти цель "рядом" по времени, иначе первую
    if (String(year) === todayY) {
      const nowTs = +today;
      let best: Aim | null = null;
      let bestDist = Number.POSITIVE_INFINITY;

      for (const a of aims) {
        const ts = +new Date(a.end_at);
        const dist = Math.abs(ts - nowTs);
        if (dist < bestDist) {
          bestDist = dist;
          best = a;
        }
      }
      return best?.id ?? aims[0].id;
    }
    return aims[0].id;
  }, [aims, year, today, todayY]);

  const refs = useRef(new Map<string, HTMLDivElement | null>());

  const setRef = (k: string) => (el: HTMLDivElement | null) => {
    refs.current.set(k, el);
  };

  const [showReturn, setShowReturn] = useState(false);

  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (!focusId) return;
    const el = refs.current.get(focusId);
    if (!el) return;

    didInitialScroll.current = true;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "auto", block: "start" }));
  }, [focusId]);

  useEffect(() => {
    if (!focusId) return;
    const el = refs.current.get(focusId);
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => setShowReturn(!entries[0].isIntersecting),
      {
        root: null,
        rootMargin: `-${STICKY_OFFSET_PX + 8}px 0px 0px 0px`,
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [focusId]);

  // ---- status mutation (Finish / Not Finish) ----
  const qc = useQueryClient();

  const setYearStatus = useMutation({
    mutationFn: async (args: { id: string; status: "done" | "not_done" }) => {
      const supabase = createClient();

      const progress = args.status === "done" ? 100 : 0;

      const { error } = await supabase
        .from("aims")
        .update({ status: args.status, progress })
        .eq("id", args.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      if (!userId) return;
      
      qc.invalidateQueries({ queryKey: ["aims", userId, "year", year] });
      qc.invalidateQueries({ queryKey: ["aims", userId, "month", year] });
      qc.invalidateQueries({ queryKey: ["aims", userId, "week", year] });
      qc.invalidateQueries({ queryKey: ["aims", userId, "day", year] });
      qc.invalidateQueries({ queryKey: ["aim_links", userId] });
    },
  });

  if (isLoading) {
    return <div className="px-4 md:px-8 py-6 font-alt opacity-70">Loading…</div>;
  }

  if (!hasAny) {
    return (
      <section className="bg-[#FFF7F0]">
        <div className="px-4 md:px-8 py-16 text-center">
          <div className="font-alt text-xl font-semibold text-[#251c16]">No aims yet.</div>
          <div className="mt-2 text-sm opacity-70">Create your first year aim to start tracking.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#FFF7F0]">
      <div className="px-4 md:px-8 py-6">
        <div className="space-y-3">
          {aims.map((aim) => {
            const isDone = aim.status === "done";
            const isNot = aim.status === "not_done";

            return (
              <div key={aim.id} ref={setRef(aim.id)}>
                <AimCard
                  aim={aim}
                  levelForStripe="year"
                  showProgress={false}
                  doneOverride={isDone}
                  onEdit={() => router.push(`/aims/${aim.id}/edit`)}
                  footer={
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setYearStatus.mutate({ id: aim.id, status: "done" })}
                        className={[
                          "px-4 py-2 rounded-full font-alt text-sm font-semibold",
                          "border border-black/25 bg-white",
                          isDone ? "opacity-100" : "opacity-80 hover:opacity-100",
                        ].join(" ")}
                        aria-pressed={isDone}
                      >
                        Finish
                      </button>

                      <button
                        type="button"
                        onClick={() => setYearStatus.mutate({ id: aim.id, status: "not_done" })}
                        className={[
                          "px-4 py-2 rounded-full font-alt text-sm font-semibold",
                          "border border-black/25 bg-white",
                          isNot ? "opacity-100" : "opacity-80 hover:opacity-100",
                        ].join(" ")}
                        aria-pressed={isNot}
                      >
                        Not Finish
                      </button>

                      {setYearStatus.isPending ? (
                        <span className="text-xs opacity-60">Saving…</span>
                      ) : null}
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}