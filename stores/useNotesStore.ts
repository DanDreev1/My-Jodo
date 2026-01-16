// stores/useNotesStore.ts
"use client";

import { create } from "zustand";
import type { NoteType } from "@/types/note";

export type NotesTab = "all" | "thoughts" | "insight" | "idea" | "plan";

type NotesFilter = "all" | NoteType;

type Camera = {
  x: number;   // screen-space px
  y: number;   // screen-space px
  zoom: number;
};

type NotesState = {
  // controls
  tab: NotesTab;
  search: string;
  setTab: (t: NotesTab) => void;
  setSearch: (q: string) => void;
  clearSearch: () => void;

  // board camera
  camera: Camera;
  setCamera: (patch: Partial<Camera> | ((c: Camera) => Partial<Camera>)) => void;
  panBy: (dx: number, dy: number) => void;
  setZoom: (z: number) => void;
  resetCamera: () => void;

  isDraggingNote: boolean;
  setDraggingNote: (v: boolean) => void;
};

const DEFAULT_CAMERA: Camera = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const useNotesStore = create<NotesState>((set, get) => ({
  tab: "all",
  search: "",
  setTab: (t) => set({ tab: t }),
  setSearch: (q) => set({ search: q }),
  clearSearch: () => set({ search: "" }),
  isDraggingNote: false,
  setDraggingNote: (v) => set({ isDraggingNote: v }),

  camera: DEFAULT_CAMERA,
  setCamera: (patch) =>
    set((state) => {
      const nextPatch = typeof patch === "function" ? patch(state.camera) : patch;
      return { camera: { ...state.camera, ...nextPatch } };
    }),
  panBy: (dx, dy) =>
    set((state) => ({
      camera: { ...state.camera, x: state.camera.x + dx, y: state.camera.y + dy },
    })),
  setZoom: (z) => set((state) => ({ camera: { ...state.camera, zoom: z } })),
  resetCamera: () => set({ camera: DEFAULT_CAMERA }),
}));