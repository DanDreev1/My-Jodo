"use client";

import { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAimsStore } from "@/stores/useAimsStore";
import { useQuery } from "@tanstack/react-query";

type FormValues = {
  title: string;
  description: string;
  end_date: string; // YYYY-MM-DD
  end_time: string; // HH:mm
};

type AimLite = {
  id: string;
  title: string;
  description: string;
  end_at: string;
};

function toISO(d: Date) {
  return d.toISOString();
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function defaultEndTime() {
  // MVP: по умолчанию 23:59 (как ты хотел)
  return "23:59";
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}
function endOfYear(d: Date) {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}


function todayDateISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalISOFromDateTime(dateStr: string, timeStr: string) {
  // локальное время -> Date -> ISO (Supabase TIMESTAMPTZ норм)
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  return dt.toISOString();
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function weekRangeInMonth(anchorDate: Date) {
  const y = anchorDate.getFullYear();
  const m = anchorDate.getMonth();
  const day = anchorDate.getDate();

  const lastDay = new Date(y, m + 1, 0).getDate();

  // определяем week index по дню месяца
  const idx = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;

  const startDay = idx === 1 ? 1 : idx === 2 ? 8 : idx === 3 ? 15 : 22;
  const endDay = idx === 1 ? 7 : idx === 2 ? 14 : idx === 3 ? 21 : lastDay;

  const start = new Date(y, m, startDay, 0, 0, 0, 0);
  const end = new Date(y, m, endDay, 23, 59, 59, 999);

  return { idx, start, end };
}

function toDateInputLocal(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInputLocal(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function AimSheetRoute({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const close = () => router.back();

  const qc = useQueryClient();

  // ✅ берём текущий таб/anchorDate из стора, чтобы вычислить level + invalidate keys
  const view = useAimsStore((s) => s.view); // "month" | "week" | "day"
  const anchorDate = useAimsStore((s) => s.anchorDate);

  const level =
    view === "year" ? "year" :
    view === "month" ? "month" :
    view === "week" ? "week" : "day";

  const year = anchorDate.getFullYear();
  const monthIndex0 = anchorDate.getMonth();

  const [importOpen, setImportOpen] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<AimLite | null>(null);

  const params = useParams<{ id: string }>();
  const aimId = params?.id;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(3);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const aimQuery = useQuery({
    queryKey: ["aim", aimId],
    enabled: mode === "edit" && !!aimId,
    queryFn: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
        .from("aims")
        .select("id,title,description,end_at,level,status,progress")
        .eq("id", aimId!)
        .single();
        if (error) throw error;
        return data as AimLite & { level: string; status: string; progress: number };
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      end_date: todayDateISO(),
      end_time: defaultEndTime(),
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (mode !== "edit") return;
    const a = aimQuery.data;
    if (!a) return;

    setValue("title", a.title);
    setValue("description", a.description ?? "");
    setValue("end_date", toDateInputLocal(a.end_at));
    setValue("end_time", toTimeInputLocal(a.end_at));
  }, [mode, aimQuery.data, setValue]);

  useEffect(() => {
    if (!confirmOpen) return;
    setDeleteCountdown(3);
    setDeleteArmed(false);

    const t = setInterval(() => {
        setDeleteCountdown((c) => {
        if (c <= 1) {
            clearInterval(t);
            setDeleteArmed(true);
            return 0;
        }
        return c - 1;
        });
    }, 1000);

    return () => clearInterval(t);
  }, [confirmOpen]);

  // ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (v: FormValues) => {
    try {
        const supabase = createClient();

        const end_at = toLocalISOFromDateTime(v.end_date, v.end_time);

        const { data: u, error: uerr } = await supabase.auth.getUser();
        if (uerr) {
            setError("title", { type: "server", message: uerr.message });
            return;
        }

        const uid = u.user?.id;
        if (!uid) {
            setError("title", { type: "server", message: "Not authenticated (no user session)" });
            return;
        }

        // общие поля
        const payload = {
            title: v.title.trim(),
            description: v.description.trim(),
            end_at,
        };

        if (mode === "create") {
            const createPayload = {
                user_id: uid,
                ...payload,
                level,
                status: "active" as const,
                progress: 0,
            };

            const { data: inserted, error: insErr } = await supabase
                .from("aims")
                .insert(createPayload)
                .select("id")
                .single();

            if (insErr) {
                setError("title", { type: "server", message: insErr.message });
                return;
            }
            if (!inserted?.id) {
                setError("title", { type: "server", message: "Insert failed: no id returned" });
                return;
            }

            if (selectedParent?.id) {
                const { error: linkErr } = await supabase.from("aim_links").insert({
                user_id: uid,
                parent_id: selectedParent.id,
                child_id: inserted.id,
                });

                if (linkErr) {
                await supabase.from("aims").delete().eq("id", inserted.id).eq("user_id", uid);
                setError("title", { type: "server", message: linkErr.message });
                return;
                }
            }
        }

        if (mode === "edit") {
            if (!aimId) {
                setError("title", { type: "server", message: "No aim id" });
                return;
            }

            // 1) update самой цели
            const { error: upErr } = await supabase
                .from("aims")
                .update(payload)
                .eq("id", aimId)
                .eq("user_id", uid);

            if (upErr) {
                setError("title", { type: "server", message: upErr.message });
                return;
            }

            // 2) если ты хочешь в edit тоже менять parent-link:
            // удаляем старые links где child_id = aimId (у ребёнка один родитель)
            const { error: delLinkErr } = await supabase
                .from("aim_links")
                .delete()
                .eq("user_id", uid)
                .eq("child_id", aimId);

            if (delLinkErr) {
                setError("title", { type: "server", message: delLinkErr.message });
                return;
            }

            // и вставляем новый если выбран
            if (selectedParent?.id) {
                const { error: insLinkErr } = await supabase.from("aim_links").insert({
                    user_id: uid,
                    parent_id: selectedParent.id,
                    child_id: aimId,
                });

                if (insLinkErr) {
                    setError("title", { type: "server", message: insLinkErr.message });
                return;
                }
            }
        }

        // invalidate ПОСЛЕ успеха
        qc.invalidateQueries({ queryKey: ["aims", "month", year] });
        qc.invalidateQueries({ queryKey: ["aims", "week", year, monthIndex0] });
        qc.invalidateQueries({ queryKey: ["aims", "day", year, monthIndex0] });
        qc.invalidateQueries({ queryKey: ["aim_links"] });
        qc.invalidateQueries({ queryKey: ["aim", aimId] });

        close();
    } catch (e: any) {
        setError("title", { type: "server", message: e?.message ?? "Unknown error" });
    }
  };

  const deleteAim = useMutation({
    mutationFn: async () => {
        const supabase = createClient();

        const { data: u, error: uerr } = await supabase.auth.getUser();
        if (uerr) throw uerr;
        const uid = u.user?.id;
        if (!uid) throw new Error("Not authenticated");

        // 1) удалить связи
        const { error: lerr } = await supabase
            .from("aim_links")
            .delete()
            .eq("user_id", uid)
            .or(`parent_id.eq.${aimId},child_id.eq.${aimId}`);

        if (lerr) throw lerr;

        // 2) удалить aim
        const { error: aerr } = await supabase
            .from("aims")
            .delete()
            .eq("user_id", uid)
            .eq("id", aimId);

        if (aerr) throw aerr;

        return true;
    },
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["aims", "month", year] });
        qc.invalidateQueries({ queryKey: ["aims", "week", year, monthIndex0] });
        qc.invalidateQueries({ queryKey: ["aims", "day", year, monthIndex0] });
        qc.invalidateQueries({ queryKey: ["aim_links"] });
        close();
    },
  });

  const canImport = view === "week" || view === "day";

  const parentLevel = view === "week" ? "month" : view === "day" ? "week" : null;

  const importTitle =
    view === "week"
        ? "Import from Month aims"
        : view === "day"
        ? "Import from Week aims"
        : "Import from Aims";

  const parentRange = useMemo(() => {
    if (view === "week") return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
    if (view === "day") {
        const r = weekRangeInMonth(anchorDate);
        return { start: r.start, end: r.end };
    }
    return null;
  }, [view, anchorDate]);

  const parentsQuery = useQuery({
    queryKey: [
        "aims-import-parents",
        parentLevel,
        parentRange?.start?.toISOString(),
        parentRange?.end?.toISOString(),
    ],
    enabled: !!parentLevel && !!parentRange && importOpen,
    queryFn: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("aims")
            .select("id,title,description,end_at")
            .eq("level", parentLevel!)
            .gte("end_at", parentRange!.start.toISOString())
            .lte("end_at", parentRange!.end.toISOString())
            .order("end_at", { ascending: true });

        if (error) throw error;
        return (data ?? []) as AimLite[];
    },
  });

  const parentsFiltered = useMemo(() => {
    const q = importSearch.trim().toLowerCase();
    const arr = parentsQuery.data ?? [];
    if (!q) return arr;
    return arr.filter((a) => a.title.toLowerCase().includes(q));
    
  }, [parentsQuery.data, importSearch]);

  return (
    <div className="fixed inset-0 z-200">
      {/* overlay */}
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
      />

      {/* sheet */}
      <aside
        className={[
          "absolute right-0 top-0 h-full",
          "w-full sm:w-105 lg:w-120",
          "bg-[#FFF7F0]",
          "border-l border-black/15",
          "shadow-[-20px_0_50px_rgba(0,0,0,0.20)]",
          "flex flex-col",
        ].join(" ")}
      >
        {/* Header */}
        <div className="h-20 px-5 flex items-center border-b border-black/10">
          <div className="font-alt text-xl font-extrabold tracking-tight">
            {mode === "create" ? "Create New Aim" : "Edit Aim"}
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="ml-auto h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/5"
          >
            <X className="h-5 w-5 text-[#251c16]" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-5 no-scrollbar"
        >
          <div className="space-y-6">
                {mode === "create" ? (
                    <div className="rounded-2xl border border-black/15 bg-[#FFE4D4] px-4 py-3 mt-5">
                        <div className="font-alt font-semibold text-sm mb-1">{importTitle}</div>

                        {selectedParent ? (
                            <>
                                <div className="text-xs opacity-80 leading-snug">
                                    Linked to: <span className="font-semibold">{selectedParent.title}</span>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                    type="button"
                                    onClick={() => setImportOpen(true)}
                                    className="rounded-xl border border-black/25 px-3 py-2 text-sm bg-white hover:bg-black/5"
                                    >
                                    Change
                                    </button>

                                    <button
                                    type="button"
                                    onClick={() => setSelectedParent(null)}
                                    className="rounded-xl border border-black/25 px-3 py-2 text-sm bg-white hover:bg-black/5"
                                    >
                                    Clear
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs opacity-80 leading-snug">
                                    (MVP) Pick a parent aim to auto-fill title / description / deadline.
                                </div>

                                <button
                                    type="button"
                                    disabled={!canImport}
                                    onClick={() => setImportOpen(true)}
                                    className={[
                                    "mt-3 rounded-xl border border-black/25 px-3 py-2 text-sm bg-white",
                                    canImport ? "hover:bg-black/5" : "opacity-50 cursor-not-allowed",
                                    ].join(" ")}
                                >
                                    Import
                                </button>
                            </>
                        )}

                        {/* ================= Import picker (inline modal) ================= */}
                        {importOpen && (
                            <div className="rounded-2xl border border-black/15 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                                <div className="flex items-center gap-3">
                                    <div className="font-alt font-semibold">Import Aim</div>

                                    <button
                                        type="button"
                                        onClick={() => setImportOpen(false)}
                                        className="ml-auto rounded-xl border border-black/25 px-3 py-1.5 text-sm hover:bg-black/5"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-3">
                                    <input
                                        value={importSearch}
                                        onChange={(e) => setImportSearch(e.target.value)}
                                        placeholder="Search by title..."
                                        className="w-full rounded-xl border border-black/25 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                                    />
                                </div>

                                <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-black/10">
                                    {parentsQuery.isLoading ? (
                                        <div className="p-3 text-sm opacity-70">Loading...</div>
                                    ) : parentsFiltered.length === 0 ? (
                                        <div className="p-3 text-sm opacity-70">No aims found in this period.</div>
                                    ) : (
                                        <div className="divide-y divide-black/10">
                                        {parentsFiltered.map((a) => {
                                            const active = selectedParent?.id === a.id;
                                            const date = new Date(a.end_at).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            });

                                            return (
                                            <button
                                                key={a.id}
                                                type="button"
                                                onClick={() => setSelectedParent(a)}
                                                className={[
                                                "w-full text-left p-3",
                                                "hover:bg-black/5 transition",
                                                active ? "bg-black/5" : "",
                                                ].join(" ")}
                                            >
                                                <div className="flex items-center gap-2">
                                                <span className="font-alt font-semibold">{a.title}</span>
                                                <span className="ml-auto text-xs opacity-60">{date}</span>
                                                </div>
                                                {a.description ? (
                                                <div className="mt-1 text-xs opacity-70 line-clamp-2">{a.description}</div>
                                                ) : null}
                                            </button>
                                            );
                                        })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setImportOpen(false)}
                                        className="rounded-xl border border-black/25 px-3 py-2 text-sm bg-white hover:bg-black/5"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!selectedParent}
                                        onClick={() => {
                                        if (!selectedParent) return;

                                        // ✅ автозаполняем RHF поля
                                        setValue("title", selectedParent.title, { shouldDirty: true });
                                        setValue("description", selectedParent.description ?? "", { shouldDirty: true });
                                        setValue("end_date", toDateInputLocal(selectedParent.end_at), { shouldDirty: true });
                                        setValue("end_time", toTimeInputLocal(selectedParent.end_at), { shouldDirty: true });

                                        setImportOpen(false);
                                        }}
                                        className={[
                                        "ml-auto rounded-xl px-4 py-2 text-sm font-alt font-semibold",
                                        "border border-black/25 bg-[#22c55e] text-black",
                                        "hover:brightness-95",
                                        !selectedParent ? "opacity-60 cursor-not-allowed" : "",
                                        ].join(" ")}
                                    >
                                        Import selected
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {mode === "edit" ? (
                            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-50 px-4 py-4">
                                <div className="font-alt font-semibold text-sm text-red-700">
                                    Danger zone
                                </div>

                                <div className="mt-1 text-xs text-red-700/80 leading-snug">
                                    Deleting an aim is permanent.  
                                    All linked goals and progress connections will be removed.
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmOpen(true)}
                                        className="px-4 py-2 rounded-full border border-red-500/40
                                                bg-white font-alt font-semibold text-red-700
                                                hover:bg-red-100 transition text-[10px] md:text-md"
                                    >
                                        Delete aim
                                    </button>

                                    <span className="text-[11px] opacity-70">
                                        This action cannot be undone
                                    </span>
                                </div>
                            </div>
                            ) : null}

                        {confirmOpen && (
                            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-50 p-4">
                                <div className="font-alt font-semibold text-sm text-red-700">
                                    Delete this aim?
                                </div>

                                <div className="mt-1 text-xs opacity-80">
                                    This will permanently remove the aim and all its links.
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-black/25 bg-white hover:bg-black/5 text-sm font-alt"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!deleteArmed || deleteAim.isPending}
                                        onClick={() => deleteAim.mutate()}
                                        className={[
                                        "ml-auto px-4 py-2 rounded-xl text-sm font-alt font-semibold",
                                        "bg-red-600 text-white",
                                        (!deleteArmed || deleteAim.isPending) ? "opacity-60 cursor-not-allowed" : "hover:brightness-95",
                                        ].join(" ")}
                                    >
                                        {!deleteArmed ? `Delete (${deleteCountdown})` : (deleteAim.isPending ? "Deleting…" : "Delete")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

            

            {/* Title */}
            <div>
                <label className="block font-alt text-sm font-semibold mb-1">
                    Card Name
                </label>
                <input
                    type="text"
                    placeholder="e.g. Work with website"
                    className="w-full rounded-xl border border-black/25 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    {...register("title", {
                    required: "Title is required",
                    minLength: { value: 2, message: "Min 2 characters" },
                    })}
                />
                {errors.title?.message ? (
                    <div className="mt-1 text-xs text-red-600 font-alt">
                    {errors.title.message}
                    </div>
                ) : null}
            </div>

            {/* Description */}
            <div>
                <label className="block font-alt text-sm font-semibold mb-1">
                    Card Details
                </label>
                <textarea
                    placeholder="Any details which could be useful"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-black/25 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    {...register("description", {
                    required: "Description is required",
                    minLength: { value: 2, message: "Min 2 characters" },
                    })}
                />
                {errors.description?.message ? (
                    <div className="mt-1 text-xs text-red-600 font-alt">
                    {errors.description.message}
                    </div>
                ) : null}
            </div>

            {/* End date & time */}
            <div>
                <label className="block font-alt text-sm font-semibold mb-1">
                    End date &amp; time
                </label>

                <div className="flex items-center gap-2">
                    <input
                    type="date"
                    className="flex-1 rounded-xl border border-black/25 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    {...register("end_date", { required: "End date is required" })}
                    />

                    <input
                    type="time"
                    className="w-27.5 rounded-xl border border-black/25 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    {...register("end_time", { required: "Time is required" })}
                    />
                </div>

                {(errors.end_date?.message || errors.end_time?.message) ? (
                    <div className="mt-1 text-xs text-red-600 font-alt">
                    {errors.end_date?.message || errors.end_time?.message}
                    </div>
                ) : (
                    <div className="mt-1 text-[11px] opacity-60">
                    Deadline is treated as local time (23:59 by default).
                    </div>
                )}
            </div>

            {/* Level placeholder */}
            <div>
              <label className="block font-alt text-sm font-semibold mb-1">
                Aim level
              </label>

              <div className="flex gap-2">
                {["Year", "Month", "Week", "Day"].map((lvlLabel) => {
                  const active =
                    (level === "year" && lvlLabel === "Year") ||
                    (level === "month" && lvlLabel === "Month") ||
                    (level === "week" && lvlLabel === "Week") ||
                    (level === "day" && lvlLabel === "Day");

                  return (
                    <div
                      key={lvlLabel}
                      className={[
                        "px-3 py-2 rounded-xl border border-black/25 text-sm bg-white font-alt",
                        active ? "opacity-100 font-semibold" : "opacity-50",
                      ].join(" ")}
                    >
                      {lvlLabel}
                    </div>
                  );
                })}
              </div>

              <div className="mt-1 text-[11px] opacity-60">
                (MVP) Level is derived from current tab.
              </div>
            </div>

            {/* Spacer so content isn't hidden behind footer */}
            <div className="h-4" />
          </div>

          {/* Footer (inside form, sticky) */}
          <div className="sticky bottom-0 -mx-5 px-5 py-4 bg-[#FFF7F0] border-t border-black/10 flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="px-5 py-2 rounded-full border border-black/25 bg-white font-alt font-semibold hover:bg-black/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={[
                "ml-auto px-5 py-2 rounded-full font-alt font-semibold",
                "bg-[#22c55e] text-black",
                "shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:brightness-95",
                isSubmitting ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}