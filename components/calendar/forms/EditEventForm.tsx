"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarEvent, EventTag } from "@/types/event";
import { useEventById } from "@/hooks/calendar/useEventById";
import { useUpdateEvent } from "@/hooks/calendar/useUpdateEvent";
import { useDeleteEvent } from "@/hooks/calendar/useDeleteEvent";

const TAGS: Array<{ tag: EventTag; label: string; color: string }> = [
  { tag: "primary", label: "Primary Task", color: "#D9412C" },
  { tag: "secondary", label: "Secondary Task", color: "#2F6FED" },
  { tag: "daily_goal", label: "Daily Goal", color: "#2FBF71" },
  { tag: "unexpected", label: "Unexpected", color: "#111111" },
  { tag: "fixed", label: "Fixed (Meeting)", color: "#F5C84C" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

function fromLocalInputValue(v: string) {
  const [datePart, timePart] = v.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function isEndAfterStart(startLocal: string, endLocal: string) {
  return fromLocalInputValue(endLocal).getTime() > fromLocalInputValue(startLocal).getTime();
}

export function EditEventForm({ id }: { id: string }) {
  const router = useRouter();
  const update = useUpdateEvent();
  const del = useDeleteEvent();

  // ✅ Хук всегда вызывается одинаково
  const { data: eventData, isLoading, error } = useEventById(id);

  // --- form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [tag, setTag] = useState<EventTag>("unexpected");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(3);
  const [deleteArmed, setDeleteArmed] = useState(false);

  // ✅ Гидрация формы, когда пришли данные
  useEffect(() => {
    if (!eventData) return;

    setTitle(eventData.title ?? "");
    setDescription(eventData.description ?? "");
    setLocation(eventData.location ?? "");
    setTag((eventData.tag as EventTag) ?? "unexpected");
    setStartLocal(toLocalInputValue(new Date(eventData.start_at)));
    setEndLocal(eventData.end_at ? toLocalInputValue(new Date(eventData.end_at)) : "");
  }, [eventData]);

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

  const titleOk = title.trim().length > 0;

  const endOk = useMemo(() => {
    if (!endLocal) return true;
    if (!startLocal) return true;
    return isEndAfterStart(startLocal, endLocal);
  }, [startLocal, endLocal]);

  const canSave =
    !!eventData &&
    titleOk &&
    endOk &&
    !update.isPending &&
    !del.isPending;

  const errorText = useMemo(() => {
    if (!titleOk) return "Card Name is required.";
    if (!endOk) return "End must be greater than Start.";
    return null;
  }, [titleOk, endOk]);

  const onSave = async () => {
    if (!eventData || !canSave) return;

    const startIso = fromLocalInputValue(startLocal).toISOString();
    const endIso = endLocal ? fromLocalInputValue(endLocal).toISOString() : null;

    await update.mutateAsync({
      id: eventData.id,
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      start_at: startIso,
      end_at: endIso,
      location: location.trim() ? location.trim() : null,
      tag,
    });

    router.push("/calendar");
  };

  const onDelete = () => {
    if (!eventData) return;
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventData) return;
    await del.mutateAsync(eventData.id);
    router.push("/calendar");
  };

  // --- UI states (после хуков, иначе ломают порядок)
  if (isLoading) return <div className="text-sm opacity-70">Loading…</div>;
  if (error) {
    return (
      <div className="text-sm text-red-700">
        Failed to load event: {(error as any)?.message ?? "Not found"}
      </div>
    );
  }
  if (!eventData) return <div className="text-sm text-red-700">Event not found.</div>;

  return (
    <div className="w-full">
      <div className="">
        <div className="space-y-5">

          {/* Name */}
          <div className="space-y-2">
            <div className="font-alt font-semibold text-[#251c16]">Card Name *</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-black/30 bg-[#FFFFFF] px-3 py-2 font-sans text-[14px] text-[#251c16] outline-none focus:border-black/70"
            />
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="font-alt font-semibold text-[#251c16]">Card Details</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-22.5 rounded-xl border border-black/30 bg-[#FFFFFF] px-3 py-2 font-sans text-[14px] text-[#251c16] outline-none focus:border-black/70"
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="font-alt font-semibold text-[#251c16]">Card Date &amp; Time *</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-[12px] font-sans text-[#251c16]/70">Start</div>
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="w-full rounded-xl border border-black/30 bg-[#FFFFFF] px-3 py-2 font-sans text-[14px] text-[#251c16] outline-none focus:border-black/70"
                />
              </div>

              <div className="space-y-2">
                <div className="text-[12px] font-sans text-[#251c16]/70">End (must be &gt; Start)</div>
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className={[
                    "w-full rounded-xl border bg-[#FFFFFF] px-3 py-2 font-sans text-[14px] text-[#251c16] outline-none focus:border-black/70",
                    endLocal && !endOk ? "border-red-500" : "border-black/30",
                  ].join(" ")}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="font-alt font-semibold text-[#251c16]">Card Location</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-black/30 bg-[#FFFFFF] px-3 py-2 font-sans text-[14px] text-[#251c16] outline-none focus:border-black/70"
              placeholder="Optional…"
            />
          </div>

          {/* Tag */}
          <div className="space-y-3">
            <div className="font-alt font-semibold text-[#251c16]">Card Tag *</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {TAGS.map((t) => {
                const active = t.tag === tag;
                return (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => setTag(t.tag)}
                    className="w-full flex items-center justify-between rounded-xl border border-black/25 bg-[#FFFFFF] px-3 py-2 hover:brightness-[0.99] transition"
                  >
                    <div className={active ? "font-alt text-[14px] font-semibold text-[#251c16]" : "font-alt text-[14px] font-medium text-[#251c16]/80"}>
                      {t.label}
                    </div>

                    <div className="relative h-6 w-6 flex items-center justify-center">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.color }} />
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: active ? "2px solid #000" : "2px solid transparent",
                          transform: "scale(1.15)",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Errors */}
          {errorText && (
            <div className="rounded-xl border border-red-500/40 bg-white/60 px-3 py-2 text-[13px] text-red-700">
              {errorText}
            </div>
          )}

          {update.error && (
            <div className="rounded-xl border border-red-500/40 bg-white/60 px-3 py-2 text-[13px] text-red-700">
              {(update.error as any)?.message ?? "Update failed"}
            </div>
          )}

          {del.error && (
            <div className="rounded-xl border border-red-500/40 bg-white/60 px-3 py-2 text-[13px] text-red-700">
              {(del.error as any)?.message ?? "Delete failed"}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="rounded-xl border border-black/30 bg-white/70 px-4 py-2 font-alt text-[14px] font-semibold text-[#251c16] hover:bg-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={del.isPending || update.isPending}
              className="rounded-xl border border-black/30 bg-black/5 px-4 py-2 font-alt text-[14px] font-semibold text-[#251c16] hover:bg-black/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="ml-auto rounded-xl border border-black/30 bg-white px-5 py-2 font-alt text-[14px] font-semibold text-[#251c16] shadow-[0_10px_22px_rgba(0,0,0,0.18)] hover:brightness-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {update.isPending ? "Saving…" : "Save"}
            </button>
          </div>
          
          {confirmOpen && (
            <div className="fixed inset-0 z-250">
                {/* overlay */}
                <button
                    type="button"
                    aria-label="Close delete confirmation"
                    onClick={() => setConfirmOpen(false)}
                    className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
                />

                {/* modal */}
                <div
                    className={[
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    "w-[min(420px,calc(100vw-32px))]",
                    "rounded-2xl border border-black/15 bg-[#FFF7F0]",
                    "shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
                    "p-4",
                    ].join(" ")}
                >
                    <div className="font-alt text-base font-extrabold text-[#251c16]">
                        Delete this card?
                    </div>

                    <div className="mt-1 text-sm text-[#251c16]/75 leading-snug">
                        This action can’t be undone. Card:{" "}
                        <span className="font-semibold text-[#251c16]">
                            {title.trim() || eventData.title}
                        </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(false)}
                            disabled={del.isPending}
                            className="rounded-xl border border-black/30 bg-white/70 px-4 py-2 font-alt text-[14px] font-semibold text-[#251c16] hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={!deleteArmed || del.isPending}
                            className={[
                            "ml-auto rounded-xl px-4 py-2 font-alt text-[14px] font-semibold",
                            "border border-black/30 bg-red-600 text-white",
                            (!deleteArmed || del.isPending)
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:brightness-95",
                            ].join(" ")}
                        >
                            {!deleteArmed ? `Delete (${deleteCountdown})` : del.isPending ? "Deleting…" : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}