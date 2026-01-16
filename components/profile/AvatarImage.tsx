"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

function initialsFromName(name: string) {
  const n = (name || "U").trim();
  const parts = n.split(/[ _.-]+/).filter(Boolean);
  const first = (parts[0]?.[0] ?? "U").toUpperCase();
  const second = (parts[1]?.[0] ?? "").toUpperCase();
  return (first + second).slice(0, 2);
}

export function AvatarImage({
  name,
  path,
  version,
  size = 44,
}: {
  name: string;
  path: string | null;
  version?: number;
  size?: number;
}) {
  const initials = useMemo(() => initialsFromName(name), [name]);

  const url = useMemo(() => {
    if (!path) return "";
    const supabase = createClient();
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?v=${version ?? 0}`;
  }, [path, version]);

  if (!path) {
    return (
      <div
        className="grid place-items-center rounded-full border border-[#251c16]/15 bg-[#251c16]/90 text-white shadow-[0_10px_30px_-22px_rgba(0,0,0,0.6)]"
        style={{ width: size, height: size }}
      >
        <span className="font-alt text-sm font-bold">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[#251c16]/15 bg-white/40 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.25)]"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Avatar" className="h-full w-full object-cover" />
    </div>
  );
}