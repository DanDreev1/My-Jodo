"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNotesStore } from "@/stores/useNotesStore";
import { useNotes } from "@/hooks/notes/useNotesQueries";
import { NoteCard } from "@/components/notes/cards/NoteCard";
import type { NoteRow } from "@/types/note";
import { useUpdateNotePosition } from "@/hooks/notes/useNotesMutations";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";

import { useRouter } from "next/navigation";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type Pt = { x: number; y: number };

export function NotesBoard() {
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const notesKey = useMemo(() => ["notes", userId] as const, [userId]);
  const camera = useNotesStore((s) => s.camera);
  const setCamera = useNotesStore((s) => s.setCamera);

  const tab = useNotesStore((s) => s.tab);
  const search = useNotesStore((s) => s.search);


  const { data: notes = [], isLoading, isError } = useNotes();

  const updatePos = useUpdateNotePosition();
  const setDraggingNote = useNotesStore((s) => s.setDraggingNote);

  const DRAG_THRESHOLD_PX = 4;

  const dragNoteRef = useRef<{
    id: string;
    startPointer: Pt; // screen
    startXY: Pt;      // world
    dragging: boolean;
  } | null>(null);

  function screenDeltaToWorld(dx: number, dy: number) {
    return { dx: dx / camera.zoom, dy: dy / camera.zoom };
  }

  const onNotePointerDown = (e: React.PointerEvent, note: NoteRow) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragNoteRef.current = {
        id: note.id,
        startPointer: { x: e.clientX, y: e.clientY },
        startXY: { x: note.x, y: note.y },
        dragging: false,
    };
  };

  const onNotePointerMove = (e: React.PointerEvent) => {
    const ctx = dragNoteRef.current;
    if (!ctx || !userId) return;

    e.stopPropagation();

    const dx = e.clientX - ctx.startPointer.x;
    const dy = e.clientY - ctx.startPointer.y;

    // 1️⃣ Проверяем порог
    if (!ctx.dragging) {
        const dist = Math.hypot(dx, dy);
        if (dist < DRAG_THRESHOLD_PX) return;

        // ⬇️ drag реально начинается ТУТ
        ctx.dragging = true;
        setDraggingNote(true);
    }

    // 2️⃣ Перевод screen → world
    const d = screenDeltaToWorld(dx, dy);

    const nx = Math.round(ctx.startXY.x + d.dx);
    const ny = Math.round(ctx.startXY.y + d.dy);

    // 3️⃣ Мгновенно двигаем в UI (optimistic, без БД)
    qc.setQueryData<NoteRow[]>(notesKey, (old) =>
        (old ?? []).map((n) =>
        n.id === ctx.id ? { ...n, x: nx, y: ny } : n
        )
    );
  };

  const onNotePointerUp = (e: React.PointerEvent) => {
    const ctx = dragNoteRef.current;
    if (!ctx || !userId) return;

    e.stopPropagation();

    // если drag реально был — сохраняем
    if (ctx.dragging) {
        const latest = qc
        .getQueryData<NoteRow[]>(notesKey)
        ?.find((n) => n.id === ctx.id);

        if (latest) {
        updatePos.mutate({
            id: latest.id,
            x: latest.x,
            y: latest.y,
        });
        }
    }

    dragNoteRef.current = null;
    setDraggingNote(false);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);

  // ----- Pan (mouse + touch one finger) -----
  const draggingRef = useRef(false);
  const startRef = useRef<{ p: Pt; cam: Pt } | null>(null);

  // pinch support
  const pointers = useRef<Map<number, Pt>>(new Map());
  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    startWorld: Pt;
  } | null>(null);

  const [grabbing, setGrabbing] = useState(false);

  function screenToWorld(screen: Pt, cam: { x: number; y: number; zoom: number }): Pt {
    return { x: (screen.x - cam.x) / cam.zoom, y: (screen.y - cam.y) / cam.zoom };
  }

  function worldToCamForScreenPoint(world: Pt, screen: Pt, zoom: number): Pt {
    return { x: screen.x - world.x * zoom, y: screen.y - world.y * zoom };
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // pinch start
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const p0 = pts[0];
      const p1 = pts[1];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const center = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };

      pinchRef.current = {
        startDist: dist,
        startZoom: camera.zoom,
        startWorld: screenToWorld(center, camera),
      };

      draggingRef.current = false;
      startRef.current = null;
      setGrabbing(true);
      return;
    }

    // pan start
    draggingRef.current = true;
    startRef.current = {
      p: { x: e.clientX, y: e.clientY },
      cam: { x: camera.x, y: camera.y },
    };
    setGrabbing(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // pinch move
    if (pointers.current.size === 2 && pinchRef.current) {
      const pts = [...pointers.current.values()];
      const p0 = pts[0];
      const p1 = pts[1];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const center = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };

      const scale = dist / Math.max(1, pinchRef.current.startDist);
      const nextZoom = clamp(pinchRef.current.startZoom * scale, 0.35, 2.25);

      const world = pinchRef.current.startWorld;
      const newCam = worldToCamForScreenPoint(world, center, nextZoom);

      setCamera({ x: newCam.x, y: newCam.y, zoom: nextZoom });
      return;
    }

    // pan move
    if (!draggingRef.current || !startRef.current) return;
    const dx = e.clientX - startRef.current.p.x;
    const dy = e.clientY - startRef.current.p.y;

    setCamera({
      x: startRef.current.cam.x + dx,
      y: startRef.current.cam.y + dy,
    });
  };

  const endPointer = (pointerId: number) => {
    pointers.current.delete(pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;

    if (pointers.current.size === 0) {
      draggingRef.current = false;
      startRef.current = null;
      setGrabbing(false);
    } else if (pointers.current.size === 1) {
      const p = [...pointers.current.values()][0];
      draggingRef.current = true;
      startRef.current = { p, cam: { x: camera.x, y: camera.y } };
      setGrabbing(true);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => endPointer(e.pointerId);
  const onPointerCancel = (e: React.PointerEvent) => endPointer(e.pointerId);

  // wheel zoom (relative to cursor)
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const screenPoint = { x: e.clientX, y: e.clientY };

    const scale = Math.exp(-e.deltaY * 0.0015);
    const nextZoom = clamp(camera.zoom * scale, 0.35, 2.25);

    const world = screenToWorld(screenPoint, camera);
    const newCam = worldToCamForScreenPoint(world, screenPoint, nextZoom);

    setCamera({ x: newCam.x, y: newCam.y, zoom: nextZoom });
  };

  // background
  const bgStyle = useMemo(() => {
    return {
      backgroundImage: "radial-gradient(rgba(37,28,22,0.18) 1px, transparent 1px)",
      backgroundSize: "26px 26px",
      backgroundPosition: "0 0",
    } as React.CSSProperties;
  }, []);

  const worldStyle: React.CSSProperties = {
    transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
    transformOrigin: "0 0",
  };

  const q = search.trim().toLowerCase();
  const hasFocus = tab !== "all" || q.length > 0;

  return (
    <div
      ref={containerRef}
      className={[
        "relative flex-1 overflow-hidden",
        "bg-[#FFF7F0]",
        grabbing ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      style={{ ...bgStyle, touchAction: "none" }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* WORLD LAYER */}
      <div className="absolute inset-0">
        <div style={worldStyle} className="absolute left-0 top-0">
          {/* Loading / error */}
          {isLoading ? (
            <div className="rounded-2xl border border-black/15 bg-white/70 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
              <div className="font-alt text-sm font-semibold text-[#251c16]">
                Loading notes…
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3">
              <div className="font-alt text-sm font-semibold text-red-700">
                Failed to load notes
              </div>
              <div className="mt-1 text-xs text-red-700/80">
                Check Supabase connection / RLS / network.
              </div>
            </div>
          ) : null}

          {/* Notes */}
          {notes.map((n) => {
            const tabOk = tab === "all" ? true : n.type === tab;
            const searchOk = q ? n.title.toLowerCase().includes(q) : true;

            const isMatch = tabOk && searchOk;
            const dimmed = hasFocus && !isMatch;

            return (
                <div
                    key={n.id}
                    className="absolute"
                    style={{
                        left: n.x,
                        top: n.y,
                        zIndex: isMatch ? 20 : 0,
                    }}
                    onPointerDown={(e) => onNotePointerDown(e, n)}
                    onPointerMove={onNotePointerMove}
                    onPointerUp={onNotePointerUp}
                    onPointerCancel={onNotePointerUp}
                >
                    <NoteCard note={n} dimmed={dimmed} onEdit={() => router.push(`/notes/${n.id}/edit`)} />
                </div>
            );
          })}

          {/* Empty state */}
          {!isLoading && !isError && notes.length === 0 ? (
            <div className="absolute left-0 top-0 w-sm">
              <div className="rounded-2xl border border-black/15 bg-white/70 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                <div className="font-alt text-sm font-semibold text-[#251c16]">
                  No notes yet.
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Create your first card with the FAB (next step).
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Debug HUD (можно убрать позже) */}
      <div className="pointer-events-none absolute left-4 bottom-4 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-alt opacity-70">
        x: {Math.round(camera.x)} • y: {Math.round(camera.y)} • zoom:{" "}
        {camera.zoom.toFixed(2)}
      </div>
    </div>
  );
}