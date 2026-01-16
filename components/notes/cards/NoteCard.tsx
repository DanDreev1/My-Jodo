"use client";

import { EllipsisVertical } from "lucide-react";
import type { NoteRow } from "@/types/note";
import { NOTE_TYPE_META } from "@/constants/notes";
import { useRouter } from "next/navigation";

export function NoteCard({
  note,
  dimmed,
  onEdit,
}: {
  note: NoteRow;
  dimmed?: boolean;
  onEdit?: () => void;
}) {
  const meta = NOTE_TYPE_META[note.type];

  return (
      <div
        className={[
            "relative w-60",
            "rounded-2xl border border-[#251c16]/15 bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.12)]",
            "select-none",
            "transition-opacity",
        ].join(" ")}
      >
      {/* category stripe */}
      <div
        className="h-3 w-full rounded-t-2xl"
        style={{ backgroundColor: meta.color }}
      />

      {/* edit button */}
      {onEdit ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          aria-label="Edit note"
          className={[
            "absolute right-2 top-4 z-10",
            "h-8 w-8 rounded-full",
            "flex items-center justify-center",
            "hover:bg-black/5",
          ].join(" ")}
        >
          <EllipsisVertical className="h-5 w-5 opacity-70" />
        </button>
      ) : null}

      {/* content */}
      <div className="px-4 pt-3 pb-4">
        {/* type label */}
        <div className="font-alt text-[11px] uppercase tracking-wide opacity-60">
          {meta.label}
        </div>

        {/* title */}
        <div className="mt-3 font-alt font-semibold text-[#251c16] leading-snug">
          {note.title}
        </div>

        {/* payload preview (MVP) */}
        {typeof note.payload?.text === "string" &&
        note.payload.text.trim().length > 0 ? (
          <div className="mt-2 text-sm opacity-75 line-clamp-3">
            {note.payload.text}
          </div>
        ) : null}
      </div>

      {dimmed && (
        <div
        className="absolute inset-0 rounded-2xl bg-[#000000]/10 pointer-events-none"
        />
      )}
    </div>
  );
}