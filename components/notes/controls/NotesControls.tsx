"use client";

import { Search } from "lucide-react";
import { useNotesStore, type NotesTab } from "@/stores/useNotesStore";
import { MobileNotesFilterDropdown } from "./MobileNotesTabDropdown";

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative px-2 py-1 text-sm md:text-base",
        "font-alt",
        active ? "font-semibold" : "font-medium opacity-80 hover:opacity-100",
      ].join(" ")}
    >
      {children}
      <span
        className={[
          "pointer-events-none absolute left-0 right-0 -bottom-1 mx-auto h-0.5 w-full",
          active ? "bg-[#E85A4F]" : "bg-transparent",
        ].join(" ")}
      />
    </button>
  );
}

function Divider() {
  return <div className="mx-4 h-6 w-px bg-[#251c16]/40" />;
}

export function NotesControls() {
  const tab = useNotesStore((s) => s.tab);
  const setTab = useNotesStore((s) => s.setTab);

  const search = useNotesStore((s) => s.search);
  const setSearch = useNotesStore((s) => s.setSearch);
  const clearSearch = useNotesStore((s) => s.clearSearch);

  return (
    <section className="sticky top-20 z-10 bg-[#FFF7F0]">
      <div className="h-22.5 px-4 md:px-8 pt-5 pb-3 flex items-center gap-4">
        {/* LEFT: search */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={[
              "flex items-center gap-2",
              "rounded-2xl border border-[#251c16]/25 bg-white/70",
              "px-3 py-2",
              "w-55 sm:w-65 md:w-85",
              "shadow-[0_10px_25px_rgba(0,0,0,0.06)]",
            ].join(" ")}
          >
            <Search className="h-4 w-4 opacity-60 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards by title..."
              className={[
                "w-full bg-transparent outline-none",
                "text-sm font-alt text-[#251c16]",
                "placeholder:opacity-60",
              ].join(" ")}
            />
            {search ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs font-alt opacity-60 hover:opacity-90"
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* DESKTOP tabs */}
        <div className="hidden md:flex md:ml-auto items-center">
          <Divider />
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            All
          </TabButton>
          <Divider />
          <TabButton active={tab === "insight"} onClick={() => setTab("insight")}>
            Insights
          </TabButton>
          <Divider />
          <TabButton active={tab === "thoughts"} onClick={() => setTab("thoughts")}>
            Thoughts
          </TabButton>
          <Divider />
          <TabButton active={tab === "idea"} onClick={() => setTab("idea")}>
            Ideas
          </TabButton>
          <Divider />
          <TabButton active={tab === "plan"} onClick={() => setTab("plan")}>
            Plans
          </TabButton>
          <Divider />
        </div>

        {/* MOBILE dropdown */}
        <MobileNotesFilterDropdown top={140} />
      </div>

      {/* линия под контролами */}
      <div className="h-0.5 bg-black shadow-[0_6px_12px_rgba(0,0,0,0.60)]" />
    </section>
  );
}