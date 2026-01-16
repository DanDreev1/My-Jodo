"use client";

import { usePathname } from "next/navigation";
import { useUiStore } from "@/stores/useUiStore";
import { BurgerIcon } from "../icons/BurgerIcon";
import { LogoIcon } from "../icons/LogoIcon";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/calendar": { title: "Calendar", subtitle: "日本・calm mode" },
  "/aims": { title: "Aims", subtitle: "日本・calm mode" },
  "/notes": { title: "Notes", subtitle: "日本・calm mode" },
  "/music": { title: "Music", subtitle: "日本・calm mode" },
  "/themes": { title: "Theme", subtitle: "日本・Japanese calm" },
  "/profile": { title: "Profile", subtitle: "日本・calm mode" },
};

export function Topbar() {
  const pathname = usePathname();
  const { openMobileSidebar } = useUiStore();

  const key = "/" + (pathname.split("/")[1] || "calendar");
  const cfg = titles[key] ?? titles["/calendar"];

  return (
    <header className="h-20 sticky top-0 z-20 bg-[#FFF7F0] backdrop-blur-sm px-7 md:px-8 flex items-center justify-between md:items-end">
      <button
        className="md:hidden h-9 w-9 flex items-center justify-center"
        onClick={openMobileSidebar}
        aria-label="Open menu"
      >
        <BurgerIcon className="w-8 h-8 text-[#251c16]/80" />
      </button>

      <div>
        <h1 className="font-alt text-2xl md:text-3xl font-extrabold tracking-tight">
          {cfg.title}
        </h1>
        <p className="font-sans text-xs md:text-sm opacity-70 mt-1">{cfg.subtitle}</p>
      </div>

      <LogoIcon className="w-9 h-9 text-[#251c16] md:hidden" />
    </header>
  );
}
