"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { NoteRow, NoteType } from "@/types/note";
import { useNotesStore } from "@/stores/useNotesStore";
import { useNotes, useNote } from "@/hooks/notes/useNotesQueries";

type FormValues = {
  title: string;
  // общий текст для всех типов
  text: string;

  // только для plan (как ты хотел “время текстом”)
  timeText: string;
};

function helperByType(t: NoteType) {
  if (t === "insight") return "What did I understand?";
  if (t === "thoughts") return "Why does it hook me?";
  if (t === "idea") return "What is the idea?";
  return "What is the plan?";
}

function typeLabel(t: NoteType) {
  return t === "insight"
    ? "Insight"
    : t === "thoughts"
    ? "Thoughts"
    : t === "idea"
    ? "Idea"
    : "Plan";
}

export function NoteSheetRoute({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const close = () => router.back();

  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const noteId = Array.isArray(rawId) ? rawId[0] : rawId;

  // CREATE: тип берём из текущего таба, EDIT: тип берём из note
  const tab = useNotesStore((s) => s.tab);
  const createDefaultType: NoteType = useMemo(() => {
    if (tab === "all") return "thoughts";
    return tab as NoteType;
  }, [tab]);

  const noteQuery = useNote(mode === "edit" ? noteId : undefined);

  const noteType: NoteType = useMemo(() => {
    if (mode === "edit") return (noteQuery.data?.type ?? "thoughts") as NoteType;
    return createDefaultType;
  }, [mode, noteQuery.data?.type, createDefaultType]);

  const helper = useMemo(() => helperByType(noteType), [noteType]);

  const didInitActiveType = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      text: "",
      timeText: "",
    },
    mode: "onSubmit",
  });

  // Prefill в EDIT
  useEffect(() => {
    if (mode !== "edit") return;
    const n = noteQuery.data;
    if (!n) return;

    const payload = (n.payload ?? {}) as any;

    reset({
      title: n.title ?? "",
      text: payload.text ?? "",
      timeText: payload.timeText ?? "",
    });
  }, [mode, noteQuery.data, reset]);

  // ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- CREATE ----------------
  const createNote = useMutation({
    mutationFn: async (v: FormValues) => {
      const supabase = createClient();

      let uid = userId;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        uid = data.user?.id ?? null;
      }
      if (!uid) throw new Error("Not authenticated");

      // создаём рядом с центром камеры (MVP)
      const cam = useNotesStore.getState().camera;
      const x = Math.round((-cam.x + 200) / cam.zoom);
      const y = Math.round((-cam.y + 160) / cam.zoom);

      const payload: any = { text: v.text.trim() };
      if (activeType === "plan") payload.timeText = v.timeText.trim();

      const { data: inserted, error } = await supabase
        .from("notes")
        .insert({
          user_id: uid,
          type: activeType,
          title: v.title.trim(),
          payload,
          x,
          y,
        })
        .select("id,user_id,type,title,payload,x,y,created_at,updated_at")
        .single();

      if (error) throw error;
      return inserted as NoteRow;
    },

    onSuccess: (created) => {
      if (!userId) return;

      const key = ["notes", userId] as const;

      qc.setQueryData<NoteRow[]>(key, (old) => {
        const arr = old ?? [];
        if (arr.some((n) => n.id === created.id)) return arr;
        return [created, ...arr];
      });

      reset();
      close();
    },

    onError: (e: any) => {
      setError("title", { type: "server", message: e?.message ?? "Error" });
    },
  });

  // ---------------- EDIT (UPDATE) ----------------
  const updateNote = useMutation({
    mutationFn: async (v: FormValues) => {
      const supabase = createClient();

      let uid = userId;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        uid = data.user?.id ?? null;
      }
      if (!uid) throw new Error("Not authenticated");
      if (!noteId) throw new Error("No note id");

      const payload: any = { text: v.text.trim() };
      if (activeType === "plan") payload.timeText = v.timeText.trim();

      const { data: updated, error } = await supabase
        .from("notes")
        .update({
          type: activeType,
          title: v.title.trim(),
          payload,
        })
        .eq("user_id", uid)
        .eq("id", noteId)
        .select("id,user_id,type,title,payload,x,y,created_at,updated_at")
        .single();

      if (error) throw error;
      return updated as NoteRow;
    },

    onSuccess: (updated) => {
      if (!userId) return;
      const key = ["notes", userId] as const;

      qc.setQueryData<NoteRow[]>(key, (old) =>
        (old ?? []).map((n) => (n.id === updated.id ? updated : n))
      );

      // опционально: обновим кэш одиночной заметки
      qc.setQueryData(["note", userId, updated.id], updated);

      close();
    },

    onError: (e: any) => {
      setError("title", { type: "server", message: e?.message ?? "Error" });
    },
  });

  // ---------------- DELETE (Danger Zone) ----------------
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(3);
  const [deleteArmed, setDeleteArmed] = useState(false);

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

  const deleteNote = useMutation({
    mutationFn: async () => {
      const supabase = createClient();

      let uid = userId;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        uid = data.user?.id ?? null;
      }
      if (!uid) throw new Error("Not authenticated");
      if (!noteId) throw new Error("No note id");

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("user_id", uid)
        .eq("id", noteId);

      if (error) throw error;
      return { id: noteId };
    },

    onMutate: async () => {
      if (!userId || !noteId) return;

      const key = ["notes", userId] as const;
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData<NoteRow[]>(key);

      qc.setQueryData<NoteRow[]>(key, (old) => (old ?? []).filter((n) => n.id !== noteId));

      return { prev, key };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },

    onSuccess: () => {
      if (userId && noteId) qc.removeQueries({ queryKey: ["note", userId, noteId] });
      close();
    },
  });

  const onSubmit = async (v: FormValues) => {
    if (mode === "create") return createNote.mutateAsync(v);
    return updateNote.mutateAsync(v);
  };

  const busy =
    isSubmitting ||
    createNote.isPending ||
    updateNote.isPending ||
    deleteNote.isPending;

  const loadingEdit = mode === "edit" && !noteQuery.data && noteQuery.isLoading;

  const [activeType, setActiveType] = useState<NoteType>(createDefaultType);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!noteQuery.data) return;
    setActiveType((noteQuery.data.type ?? "thoughts") as NoteType);
}, [mode, noteQuery.data]);

  const activeHelper = useMemo(() => helperByType(activeType), [activeType]);

  if (mode === "edit" && (noteQuery.isLoading || !noteQuery.data)) {
    return <div className="text-sm opacity-70">Loading…</div>;
  }

  return (
    <div className="fixed inset-0 z-200">
        {/* overlay */}
        <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        />

        {/* responsive sheet (mobile friendly) */}
        <aside
        className={[
            // mobile: almost full screen with padding
            "absolute inset-x-3 top-3 bottom-3",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 top-37.5 sm:top-24 sm:-translate-x-1/2",
            // width (narrower!)
            "w-[calc(100vw-24px)] sm:w-140 md:w-170 lg:w-185",
            // height
            "h-[calc(100dvh-280px)] sm:h-[min(720px,calc(100dvh-140px))]",
            // look
            "rounded-[22px] sm:rounded-[28px]",
            "bg-[#FDF4EC]",
            "border border-black/25",
            "shadow-[0_28px_70px_rgba(0,0,0,0.35)]",
            "overflow-hidden",
            "flex flex-col",
        ].join(" ")}
        >
        {/* ===== TOP BAR ===== */}
        <div className="shrink-0 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-black/25 bg-[#FDF4EC]">
            <div className="flex justify-between gap-4">
                <button
                    type="submit"
                    form="note-sheet-form"
                    disabled={busy || loadingEdit}
                    className={[
                        "h-11",
                        "w-full sm:w-auto sm:ml-auto",
                        "px-8",
                        "rounded-2xl",
                        "border border-black/35",
                        "bg-[#1EF000]",
                        "font-alt font-extrabold text-sm",
                        "hover:brightness-95 transition",
                        (busy || loadingEdit) ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                >
                    {mode === "create"
                        ? createNote.isPending
                        ? "Saving…"
                        : "Save note"
                        : updateNote.isPending
                        ? "Saving…"
                        : "Save note"}
                </button>
                
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="h-11 w-15 rounded-full border border-black/20 bg-white/60 flex items-center justify-center hover:bg-black/5 transition sm:hidden"
                >
                    <X className="h-5 w-5 text-[#251c16]" />
                </button>
            </div>
        </div>

        {/* ===== TABS ROW (mobile friendly) ===== */}
        <div className="shrink-0 px-4 sm:px-6 py-4 bg-[#FDF4EC]">
            <div className="flex items-center justify-between">
                <div
                className={[
                    "w-full max-w-130",          // на мобилке не растягиваем бесконечно
                    "flex items-stretch",
                    "rounded-2xl overflow-hidden",
                    "border border-black/35",
                    "bg-white/40",
                ].join(" ")}
                >
                {([
                    ["insight", "Insight"],
                    ["plan", "Plan"],
                    ["idea", "Ideas"],
                    ["thoughts", "Thoughts"],
                ] as const).map(([t, label], idx, arr) => {
                    const active = activeType === t;

                    return (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setActiveType(t)}
                        aria-pressed={active}
                        className={[
                        "relative flex-1",
                        "px-2 sm:px-6",
                        "py-3",
                        "text-center",
                        "font-alt text-[12px] md:text-sm",
                        active ? "font-extrabold text-black" : "font-semibold text-black/70",
                        "hover:text-black transition",
                        idx !== arr.length - 1 ? "border-r border-black/35" : "",
                        ].join(" ")}
                    >
                        <span className="block truncate">{label}</span>

                        {/* underline */}
                        <span
                        className={[
                            "absolute left-3 right-3 sm:left-5 sm:right-5 bottom-1.5 h-0.5",
                            active ? "bg-[#E85A4F]" : "bg-transparent",
                        ].join(" ")}
                        />
                    </button>
                    );
                })}
                </div>

                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="ml-3 hidden sm:flex h-10 w-10 rounded-full items-center justify-center hover:bg-black/5"
                >
                    <X className="h-5 w-5 text-[#251c16]" />
                </button>
            </div>
        </div>

        {/* ===== SCROLL AREA (Y) ===== */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
            <form
            id="note-sheet-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-4 sm:px-6 md:px-10 py-6 sm:py-10"
            >
            {loadingEdit ? (
                <div className="rounded-2xl border border-black/15 bg-white/60 px-4 py-3 font-alt opacity-80">
                Loading…
                </div>
            ) : (
                <>
                {/* responsive grid: 1 col on mobile, 2 cols on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-6 md:gap-y-8 md:gap-x-10">
                    {/* Title */}
                    <div className="font-alt text-sm text-black/80">
                    {activeType === "insight" ? "Lesson name" : "Card name"}
                    </div>

                    <div>
                    <input
                        type="text"
                        placeholder={activeType === "insight" ? "Lesson name" : "Card name"}
                        className={[
                        "h-11 w-full",
                        "rounded-2xl",
                        "border border-black/30",
                        "bg-white/55",
                        "px-5",
                        "font-alt text-sm",
                        "placeholder:text-black/45",
                        "focus:outline-none focus:ring-2 focus:ring-black/20",
                        ].join(" ")}
                        {...register("title", {
                        required: "Title is required",
                        minLength: { value: 1, message: "Min 1 character" },
                        })}
                    />
                    {errors.title?.message ? (
                        <div className="mt-2 text-xs text-red-600 font-alt">
                        {errors.title.message}
                        </div>
                    ) : null}
                    </div>

                    {/* Plan time (ONLY when activeType === plan) */}
                    {activeType === "plan" ? (
                    <>
                        <div className="font-alt text-sm text-black/80">Time (as text)</div>
                        <div>
                        <input
                            type="text"
                            placeholder="e.g. Tomorrow 18:00 / This week / 20 min"
                            className={[
                            "h-11 w-full",
                            "rounded-2xl",
                            "border border-black/30",
                            "bg-white/55",
                            "px-5",
                            "font-alt text-sm",
                            "placeholder:text-black/45",
                            "focus:outline-none focus:ring-2 focus:ring-black/20",
                            ].join(" ")}
                            {...register("timeText")}
                        />
                        <div className="mt-2 text-[11px] opacity-60">
                            (MVP) Just a text label, no date parsing.
                        </div>
                        </div>
                    </>
                    ) : null}

                    {/* Text */}
                    <div className="font-alt text-sm text-black/80">
                    {activeHelper}
                    </div>

                    <div>
                    <textarea
                        rows={7}
                        placeholder={activeHelper}
                        className={[
                        "w-full",
                        "rounded-2xl",
                        "border border-black/30",
                        "bg-white/55",
                        "px-5 py-4",
                        "font-alt text-sm",
                        "placeholder:text-black/45",
                        "resize-none",
                        "focus:outline-none focus:ring-2 focus:ring-black/20",
                        ].join(" ")}
                        {...register("text", {
                        required: "Text is required",
                        minLength: { value: 1, message: "Min 1 character" },
                        })}
                    />
                    {errors.text?.message ? (
                        <div className="mt-2 text-xs text-red-600 font-alt">
                        {errors.text.message}
                        </div>
                    ) : null}
                    </div>
                </div>

                {/* Danger zone (ONLY EDIT) */}
                {mode === "edit" ? (
                    <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-50 px-5 py-5">
                        <div className="font-alt font-semibold text-sm text-red-700">
                            Danger zone
                        </div>
                        <div className="mt-1 text-xs text-red-700/80 leading-snug">
                            Deleting a card is permanent.
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="px-4 py-2 rounded-2xl border border-red-500/40 bg-white font-alt font-semibold text-red-700 hover:bg-red-100 transition"
                            >
                            Delete card
                            </button>
                            <span className="text-[11px] opacity-70">
                            This action cannot be undone
                            </span>
                        </div>
                    </div>
                ) : null}

                {confirmOpen ? (
                    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-50 p-4">
                        <div className="font-alt font-semibold text-sm text-red-700">
                            Delete this card?
                        </div>
                        <div className="mt-1 text-xs opacity-80">
                            It will be removed from the board permanently.
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                            <button
                            type="button"
                            onClick={() => setConfirmOpen(false)}
                            className="px-4 py-2 rounded-2xl border border-black/25 bg-white hover:bg-black/5 text-sm font-alt"
                            >
                            Cancel
                            </button>

                            <button
                            type="button"
                            disabled={!deleteArmed || deleteNote.isPending}
                            onClick={() => deleteNote.mutate()}
                            className={[
                                "sm:ml-auto px-4 py-2 rounded-2xl text-sm font-alt font-semibold",
                                "bg-red-600 text-white",
                                (!deleteArmed || deleteNote.isPending)
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:brightness-95",
                            ].join(" ")}
                            >
                            {!deleteArmed
                                ? `Delete (${deleteCountdown})`
                                : deleteNote.isPending
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="h-8" />
                </>
            )}
            </form>
        </div>
        </aside>
    </div>
  );
}