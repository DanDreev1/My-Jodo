"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEditNicknameModalStore } from "@/stores/useEditNicknameModalStore";

function normalizeNick(v: string) {
  return v.trim().replace(/\s+/g, " ");
}

function validateNick(v: string) {
  const s = normalizeNick(v);
  if (s.length < 2) return "Nickname is too short (min 2 chars).";
  if (s.length > 24) return "Nickname is too long (max 24 chars).";
  if (!/^[a-zA-Z0-9 _.-]+$/.test(s)) return "Use letters, numbers, spaces, _ . -";
  return null;
}

export function EditNicknameModal() {
  const qc = useQueryClient();
  const supabase = createClient();

  const userId = useAuthStore((s) => s.userId);

  const open = useEditNicknameModalStore((s) => s.open);
  const initialValue = useEditNicknameModalStore((s) => s.initialValue);
  const loading = useEditNicknameModalStore((s) => s.loading);
  const hide = useEditNicknameModalStore((s) => s.hide);
  const setLoading = useEditNicknameModalStore((s) => s.setLoading);

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const error = useMemo(() => validateNick(value), [value]);
  const canSave = !error && normalizeNick(value) !== normalizeNick(initialValue);

  const onClose = () => {
    if (loading) return;
    hide();
  };

  const onSave = async () => {
    if (!userId) return;
    if (!canSave || loading) return;

    const next = normalizeNick(value);

    setLoading(true);
    try {
      // пример: допустим, у тебя profiles.nickname
      const { error } = await supabase
        .from("profiles")
        .update({ nickname: next })
        .eq("id", userId);

      if (error) throw error;

      // важно: дёрнуть обновление профиля в react-query (подставь свой ключ)
      await qc.invalidateQueries({ queryKey: ["profile-identity"] });

      hide();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-260">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />

      <div className="absolute left-1/2 top-1/2 w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2">
        <div
          role="dialog"
          aria-modal="true"
          className="rounded-[28px] border border-[#251c16]/15 bg-white/90 p-5 md:p-6 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.6)] backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-alt text-lg font-bold">Edit nickname</h3>

          <div className="mt-4">
            <label className="text-xs opacity-60">Nickname</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Daniil"
              className={[
                "mt-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold",
                "border border-[#251c16]/15 bg-white/70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              ].join(" ")}
            />

            {error ? (
              <div className="mt-3 rounded-2xl border border-[#c24a36]/25 bg-[#c24a36]/10 p-3 text-xs">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold",
                "border border-[#251c16]/20 bg-white/70",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canSave || loading}
              onClick={onSave}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold text-white",
                "bg-[#0f766e] hover:opacity-95 active:opacity-90",
                (!canSave || loading) ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}