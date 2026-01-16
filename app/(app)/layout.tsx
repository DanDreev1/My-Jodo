"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
// import { MusicPlayer } from "@/components/layout/MusicPlayer";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      {/* Sidebar в потоке + sticky */}
      {/* Desktop sticky wrapper */}
      <div className="hidden md:block sticky top-0 h-dvh">
        <Sidebar />
      </div>

      {/* Mobile sidebar (drawer) */}
      <div className="md:hidden">
        <Sidebar />
      </div>


      {/* Контент */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar sticky (не fixed) */}
        <div className="sticky top-0 z-30">
          <Topbar />
        </div>

        <main className="flex-1">
          {children}
        </main>

        <div
            id="content-overlay-root"
            className="absolute inset-0 z-200 pointer-events-none"
        />
      </div>

      {/* <MusicPlayer /> */}
    </div>
  );
}
