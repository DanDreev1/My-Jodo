"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/ui/useToast";
import { fileToSquareWebp } from "@/lib/images";
import { AvatarImage } from "./AvatarImage";

const INPUT_MAX_MB = 8; // до конвертации
const OUTPUT_MAX_BYTES = 300_000; // итоговый webp

export function AvatarUploader({
  userId,
  name,
  avatarPath,
  avatarVersion,
  size = 44,
}: {
  userId: string | null;
  name: string;
  avatarPath: string | null;
  avatarVersion: number;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (file: File | null) => {
    if (!file || !userId) return;

    if (file.size > INPUT_MAX_MB * 1024 * 1024) {
      toast({ type: "error", title: "Too large", message: `Max ${INPUT_MAX_MB}MB.` });
      return;
    }

    setUploading(true);
    try {
      const webp = await fileToSquareWebp(file, 256, 0.85);

      if (webp.size > OUTPUT_MAX_BYTES) {
        toast({
          type: "error",
          title: "Too large",
          message: "Avatar is too big even after compression.",
        });
        return;
      }

      const fd = new FormData();
      fd.append("file", webp);

      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });

      if (res.status === 429) {
        const body = await res.json().catch(() => null);
        const left = body?.leftHours ? ` Try again in ~${body.leftHours}h.` : "";
        toast({
          type: "error",
          title: "Too soon",
          message: `You can change avatar once per 2 days.${left}`,
          durationMs: 3200,
        });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast({
          type: "error",
          title: "Upload failed",
          message: body?.error ? String(body.error) : "Could not upload avatar.",
          durationMs: 3200,
        });
        return;
      }

      toast({ type: "success", title: "Saved", message: "Avatar updated." });
      qc.invalidateQueries({ queryKey: ["profile", "avatar", userId] });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={pick}
        disabled={!userId || uploading}
        aria-label="Change avatar"
        className={[
          "group relative block",
          (!userId || uploading) ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <AvatarImage
          name={name}
          path={avatarPath}
          version={avatarVersion}
          size={size}
        />

        {/* small overlay */}
        <span
          className={[
            "absolute -bottom-1 -right-1",
            "rounded-full border border-[#251c16]/20 bg-white/80 px-1 py-0.5",
            "text-[10px] font-semibold text-[#251c16]/80",
            "shadow-[0_12px_40px_-28px_rgba(0,0,0,0.5)]",
            "backdrop-blur",
            "transition-opacity duration-150",
            "group-hover:opacity-100 opacity-90",
          ].join(" ")}
        >
           {uploading ? "…" : "✎"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}