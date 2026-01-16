"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useCreateEvent } from "@/hooks/calendar/useCreateEvent";
import { CalendarDays, Clock3, MapPin, Tag, FileText } from "lucide-react";

import type { EventTag } from "@/types/event";
import { TAG_COLOR, TAG_LABEL, DEFAULT_TAG } from "@/lib/eventTags";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

type AimLite = {
  id: string;
  title: string;
  description: string | null;
  end_at: string | null;
};


const TAGS: EventTag[] = ["primary", "secondary", "daily_goal", "unexpected", "fixed"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** anchorDate -> datetime-local default (09:00) */
function defaultStartLocal(anchor: Date) {
  const d = new Date(anchor);
  d.setHours(9, 0, 0, 0);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

function toIsoFromLocalInput(v: string) {
  // v: "YYYY-MM-DDTHH:mm" (local)
  return new Date(v).toISOString();
}

function toLocalDateInputFromISO(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalDateTimeInputFromISO(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

function dayBoundsIso(dateStr: string) {
  // dateStr: YYYY-MM-DD (локальная дата)
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  const end = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function formatEndAtLabel(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CreateEventForm() {
  const router = useRouter();
  const anchorDate = useCalendarStore((s) => s.anchorDate);

  const create = useCreateEvent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [startLocal, setStartLocal] = useState(() => defaultStartLocal(anchorDate));
  const [endEnabled, setEndEnabled] = useState(false);
  const [endLocal, setEndLocal] = useState("");

  const [tag, setTag] = useState<EventTag>(DEFAULT_TAG);
  
  const [importOpen, setImportOpen] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [importDate, setImportDate] = useState(""); // YYYY-MM-DD
  const [selectedAim, setSelectedAim] = useState<AimLite | null>(null);


  const error = useMemo(() => {
    if (!title.trim()) return "Title is required.";
    if (endEnabled) {
      if (!endLocal) return "End time is required (or disable it).";
      const s = new Date(startLocal).getTime();
      const e = new Date(endLocal).getTime();
      if (!(e > s)) return "End time must be later than start time.";
    }
    return null;
  }, [title, endEnabled, endLocal, startLocal]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      start_at: toIsoFromLocalInput(startLocal),
      end_at: endEnabled && endLocal ? toIsoFromLocalInput(endLocal) : null,
    } as const;

    try {
      await create.mutateAsync({
        ...payload,
        location: location.trim() || undefined,
        tag,
      } as any);

      router.back();
    } catch (err) {
      // react-query покажет статус, но можно оставить тихо
      console.error(err);
    }
  };

  const aimsQuery = useQuery({
    queryKey: ["aims-import", "day", importDate],
    enabled: importOpen, // грузим только когда пикер открыт
    queryFn: async () => {
      const supabase = createClient();

      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      const uid = u.user?.id;
      if (!uid) throw new Error("Not authenticated");

      let q = supabase
        .from("aims")
        .select("id,title,description,end_at")
        .eq("user_id", uid)
        .eq("level", "day")
        .order("end_at", { ascending: true });

      if (importDate) {
        const { startIso, endIso } = dayBoundsIso(importDate);
        q = q.gte("end_at", startIso).lte("end_at", endIso);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []) as AimLite[];
    },
  });

  const aimsFiltered = useMemo(() => {
    const q = importSearch.trim().toLowerCase();
    const arr = aimsQuery.data ?? [];
    if (!q) return arr;

    return arr.filter((a) => (a.title ?? "").toLowerCase().includes(q));
  }, [aimsQuery.data, importSearch]);

  return (
    <form onSubmit={onSubmit} className="text-[#251c16]">
      {/* Import from Aims */}
      <div className="mb-4 rounded-2xl border border-black/15 bg-[#FFE4D4] px-4 py-3">
        <div className="font-alt font-semibold text-sm mb-1">Import from Aims</div>
            <div className="text-xs opacity-80">
            Pick a <span className="font-semibold">day</span> aim to auto-fill title / description / end time.
            </div>

            {!importOpen ? (
            <div className="mt-3 flex items-center gap-2">
                <button
                type="button"
                onClick={() => {
                    setImportOpen(true);
                    setSelectedAim(null);
                }}
                className="rounded-xl border border-black/25 px-3 py-2 text-sm bg-white hover:bg-black/5"
                >
                Open picker
                </button>

                {(title || description || endEnabled) && (
                <button
                    type="button"
                    onClick={() => {
                    // не обязан, но удобно
                    setImportSearch("");
                    setImportDate("");
                    }}
                    className="rounded-xl border border-black/25 px-3 py-2 text-sm bg-white hover:bg-black/5"
                >
                    Clear filters
                </button>
                )}
            </div>
            ) : (
            <div className="mt-3 rounded-2xl border border-black/15 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                <div className="flex items-center gap-2">
                <div className="font-alt font-semibold text-sm">Pick an aim</div>

                <button
                    type="button"
                    onClick={() => setImportOpen(false)}
                    className="ml-auto h-9 w-9 rounded-full border border-black/20 flex items-center justify-center hover:bg-black/5"
                    aria-label="Close import"
                >
                    <X className="h-4 w-4" />
                </button>
                </div>

                {/* filters */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                    value={importSearch}
                    onChange={(e) => setImportSearch(e.target.value)}
                    placeholder="Search by title..."
                    className="w-full rounded-xl border border-black/25 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
                />

                <input
                    type="date"
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                    className="w-full rounded-xl border border-black/25 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
                />
                </div>

                <div className="mt-2 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                    setImportSearch("");
                    setImportDate("");
                    setSelectedAim(null);
                    }}
                    className="rounded-xl border border-black/20 px-3 py-2 text-xs bg-white hover:bg-black/5"
                >
                    Reset
                </button>

                <div className="ml-auto text-[11px] opacity-60">
                    {aimsQuery.isLoading ? "Loading…" : `${aimsFiltered.length} found`}
                </div>
                </div>

                {/* list */}
                <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-black/10">
                {aimsQuery.isLoading ? (
                    <div className="p-3 text-sm opacity-70">Loading...</div>
                ) : aimsFiltered.length === 0 ? (
                    <div className="p-3 text-sm opacity-70">No aims found.</div>
                ) : (
                    <div className="divide-y divide-black/10">
                    {aimsFiltered.map((a) => {
                        const active = selectedAim?.id === a.id;
                        const endLabel = a.end_at ? formatEndAtLabel(a.end_at) : "—";

                        return (
                        <button
                            key={a.id}
                            type="button"
                            onClick={() => setSelectedAim(a)}
                            className={[
                            "w-full text-left p-3 hover:bg-black/5 transition",
                            active ? "bg-black/5" : "",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-2">
                            <span className="font-alt font-semibold text-sm">{a.title}</span>
                            <span className="ml-auto text-xs opacity-60">{endLabel}</span>
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

                {/* actions */}
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
                    disabled={!selectedAim}
                    onClick={() => {
                    if (!selectedAim) return;

                    setTitle(selectedAim.title ?? "");
                    setDescription(selectedAim.description ?? "");

                    if (selectedAim.end_at) {
                        setEndEnabled(true);
                        setEndLocal(toLocalDateTimeInputFromISO(selectedAim.end_at));
                    }

                    setImportOpen(false);
                    }}
                    className={[
                    "ml-auto rounded-xl px-4 py-2 text-sm font-alt font-semibold",
                    "border border-black/25 bg-[#22c55e] text-black hover:brightness-95",
                    !selectedAim ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                >
                    Import selected
                </button>
                </div>
            </div>
            )}
        </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" />
            <div className="font-alt font-semibold text-sm">Card Name</div>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-[#251c16] outline-none focus:border-black/40"
            placeholder="e.g. Work with website"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 opacity-80" />
            <div className="font-alt font-semibold text-sm">Card Details</div>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-24 rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-[#251c16] outline-none focus:border-black/40 no-scrollbar"
            placeholder="Any details which could be useful"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-4 w-4" />
              <div className="font-alt font-semibold text-sm">Start</div>
            </div>
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-[#251c16] outline-none focus:border-black/40"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock3 className="h-4 w-4" />
              <div className="font-alt font-semibold text-sm">End</div>

              <label className="ml-auto flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={endEnabled}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setEndEnabled(v);
                    if (!v) setEndLocal("");
                  }}
                />
                enable
              </label>
            </div>

            <input
              type="datetime-local"
              value={endLocal}
              disabled={!endEnabled}
              onChange={(e) => setEndLocal(e.target.value)}
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                endEnabled
                  ? "border-black/20 bg-white text-[#251c16] focus:border-black/40"
                  : "border-black/10 bg-black/5 text-[#251c16]/60 cursor-not-allowed",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4" />
            <div className="font-alt font-semibold text-sm">Location</div>
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-[#251c16] outline-none focus:border-black/40"
            placeholder="e.g. Home"
          />
        </div>

        {/* Tag -> color */}
        <div>
            <div className="font-alt text-sm font-semibold mb-2">Card Tag!</div>

            <div className="space-y-2">
            {TAGS.map((t) => {
                const active = t === tag;

                return (
                <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-black/5 transition"
                >
                    <div className="flex items-center gap-3">
                    <span
                        className="relative inline-flex items-center justify-center"
                        style={{ width: 18, height: 18 }}
                    >
                        {/* border НЕ сдвигает контент: делаем внешнее кольцо абсолютом */}
                        <span
                        className="absolute -inset-0.5 rounded-full"
                        style={{
                            border: active ? "1px solid #000" : "1px solid transparent",
                        }}
                        />
                        <span
                        className="rounded-full"
                        style={{
                            width: 14,
                            height: 14,
                            backgroundColor: TAG_COLOR[t],
                        }}
                        />
                    </span>

                    <span className={["font-alt text-sm", active ? "font-bold" : "font-light"].join(" ")}>
                        {TAG_LABEL[t]}
                    </span>
                    </div>

                    {/* маленький маркер активного */}
                    <span className={active ? "text-xs font-alt opacity-80" : "text-xs font-alt opacity-0"}>
                    Selected
                    </span>
                </button>
                );
            })}
            </div>
        </div>
      </div>
      {/* error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* actions */}
      <div className="mt-6 flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-black/25 bg-[#FFE4D4] px-4 py-2 font-alt text-sm hover:bg-[#ffd8c2]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!!error || create.isPending}
          className={[
            "rounded-xl border border-black/30 px-4 py-2 font-alt text-sm font-semibold",
            !!error || create.isPending
              ? "bg-black/10 text-[#251c16]/60 cursor-not-allowed"
              : "bg-white hover:bg-black/5",
          ].join(" ")}
        >
          {create.isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
