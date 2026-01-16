"use client";

// app/notes/page.tsx
import { NotesControls } from "@/components/notes/controls/NotesControls";
import { NotesBoard } from "@/components/notes/board/NotesBoard";

export default function NotesPage() {
  return (
    <section className="bg-[#FFF7F0] min-h-dvh flex flex-col">
      <NotesControls />
      <NotesBoard />
    </section>
  );
}
