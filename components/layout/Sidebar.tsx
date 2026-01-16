"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/stores/useUiStore";
import { useMemo, useState } from "react";

import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { AimsIcon } from "@/components/icons/AimsIcon";
import { NotesIcon } from "@/components/icons/NotesIcon";
import { MusicIcon } from "@/components/icons/MusicIcon";
import { ThemesIcon } from "@/components/icons/ThemesIcon";
import { useLocalClock } from "@/hooks/ui/useLocalClock";
import { LogoIcon } from "@/components/icons/LogoIcon";
import { BurgerIcon } from "@/components/icons/BurgerIcon";

import { useProfileAvatar } from "@/hooks/profile/useProfileAvatar";
import { AvatarImage } from "@/components/profile/AvatarImage";
import { useProfileIdentity } from "@/hooks/profile/useProfileIdentity.ts";
import type { ComponentType } from "react";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/aims", label: "Aims", Icon: AimsIcon },
  { href: "/notes", label: "Notes", Icon: NotesIcon },
  { href: "/music", label: "Music", Icon: MusicIcon },
  { href: "/themes", label: "Theme", Icon: ThemesIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    isSidebarOpen,
    toggleSidebar,
    isMobileSidebarOpen,
    closeMobileSidebar,
  } = useUiStore();

  const [logoHover, setLogoHover] = useState(false);

  const desktopWidth = isSidebarOpen ? "w-64" : "w-20";

  const activeHref = useMemo(() => {
    const base = "/" + (pathname.split("/")[1] || "calendar");
    return base;
  }, [pathname]);

  const { user, nickname } = useProfileIdentity();
  const userId = user?.id ?? null;
  const { data } = useProfileAvatar(userId);
  const { timeLabel, dateLabel, ready } = useLocalClock();

  return (
    <>
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside
        className={[
          "hidden md:flex",
          "font-alt",
          "relative overflow-hidden",
          "h-dvh",
          desktopWidth,
          "flex-col",
          "border-r-[3px] border-[#E85A4F]",
          "bg-[#f5e3d4]",
          "transition-all duration-300",
        ].join(" ")}
      >
            <div
                className="h-16 px-4 flex items-center"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
            >
                {/* COLLAPSED */}
                {!isSidebarOpen ? (
                    <div className="w-full flex items-center justify-center">
                        {logoHover ? (
                            <button
                                type="button"
                                aria-label="Expand sidebar"
                                onClick={toggleSidebar}
                                className="h-10 w-10 transition flex items-center justify-center"
                            >
                                <BurgerIcon className="w-8 h-8 text-[#251c16]/80" />
                            </button>
                        ) : (
                            <LogoIcon className="w-9 h-9 text-[#251c16]" />
                        )}
                    </div>
                ) : (
                    /* EXPANDED */
                    <>
                        <LogoIcon className="w-9 h-9 text-[#251c16]" />

                        <button
                            type="button"
                            aria-label="Collapse sidebar"
                            onClick={toggleSidebar}
                            className="ml-auto h-10 w-10 transition flex items-center justify-center"
                        >
                            <BurgerIcon className="w-8 h-8 text-[#251c16]/80" />
                        </button>
                    </>
                )}
            </div>

            {/* Меню */}
            <nav className="px-2 mt-5 flex-1 space-y-1">
                {NAV.map((item) => {
                    const isActive = activeHref === item.href;

                    return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={[
                        "flex items-center gap-5 rounded-full px-3 py-2 text-md transition",
                        isSidebarOpen
                            ? "justify-start gap-3 px-3 py-2"
                            : "justify-center mx-auto",
                        isActive
                            ? "font-bold"
                            : "font-light",
                        ].join(" ")}
                    >
                        <item.Icon className="w-7 h-7 text-[#251c16]" />

                        {/* текст пункта меню */}
                        {isSidebarOpen && <span className="text-1xl">{item.label}</span>}
                    </Link>
                    );
                })}
            </nav>

            {/* Сакура (пока placeholder) — только когда sidebar открыт */}
            {isSidebarOpen && (
                <div className="relative flex-1">
                    <Image
                        src="/Sakura.png"
                        alt=""
                        width={360}
                        height={700}
                        priority
                        className="pointer-events-none absolute -left-7.5 -bottom-27.5 opacity-30 scale-75 select-none"
                    />
                </div>
            )}

            {/* Профиль внизу */}
            <div className={["mt-auto", isSidebarOpen ? "px-4" : "pb-2"].join(" ")}>
                {/* Разделитель показываем только в expanded (по желанию) */}
                <div className={isSidebarOpen ? "border-t border-[#e3cbb6] pt-2" : ""}>
                    <Link
                    href="/profile"
                    className={[
                        "transition",
                        isSidebarOpen
                        ? "flex items-center gap-3 rounded-2xl hover:bg-[#f4decb] p-2"
                        : "flex justify-center",
                    ].join(" ")}
                    aria-label="Profile"
                    >
                    <AvatarImage
                        name={nickname || "User"}
                        path={data?.avatar_path ?? null}
                        version={data?.avatar_version ?? 0}
                        size={36}
                    />

                    {isSidebarOpen && (
                        <div className="text-xs">
                        <div className="font-semibold leading-tight">{nickname || "User"}</div>
                        <div className="text-[10px]">
                            {ready ? (
                                <>
                                {timeLabel} · {dateLabel} <span className="opacity-60">local</span>
                                </>
                            ) : (
                                <span className="opacity-60">—</span>
                            )}
                            </div>
                        </div>
                    )}
                    </Link>
                </div>
            </div>
      </aside>

      {/* ===================== MOBILE DRAWER ===================== */}
      <aside
        className={[
            "md:hidden",
            "fixed inset-y-0 left-0 top-0 bottom-0 z-50",
            "w-72",
            "h-dvh flex flex-col",
            "font-alt",
            "bg-[#f5e3d4]",
            "border-r border-[#e3cbb6]",
            "transform transition-transform duration-300",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        >
        {/* Верх внутри drawer */}
        <div className="h-16 px-4 flex items-center gap-2">
          <LogoIcon className="w-9 h-9 text-[#251c16]" />
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeMobileSidebar}
            className="ml-auto h-10 w-10 transition flex items-center justify-center"
          >
            <BurgerIcon className="w-8 h-8 text-[#251c16]/80" />
          </button>
        </div>

        {/* Меню */}
        <nav className="px-3 mt-10 space-y-1">
            {NAV.map((item) => {
                const isActive = activeHref === item.href;

                return (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className={[
                    "flex items-center gap-4 rounded-full px-3 py-2 transition",
                    isActive ? "bg-[#f0d2bd] font-bold" : "hover:bg-[#f4decb] font-medium",
                    ].join(" ")}
                >
                    <item.Icon className="w-7 h-7 text-[#251c16]" />
                    <span className="text-lg">{item.label}</span>
                </Link>
                );
            })}
        </nav>

        {/* Sakura (mobile) */}
        <div className="relative flex-1 overflow-hidden">
            <Image
                src="/Sakura.png"
                alt=""
                width={360}
                height={700}
                priority
                className="pointer-events-none absolute -left-8.75 -bottom-27.5 opacity-30 scale-75 select-none"
            />
        </div>

        {/* Профиль */}
        <div className="mt-auto px-4 pb-2">
          <div className="border-t border-[#e3cbb6] pt-4">
            <Link
              href="/profile"
              onClick={closeMobileSidebar}
              className="flex items-center gap-3 rounded-2xl hover:bg-[#f4decb] transition p-2"
            >
              <AvatarImage
                name={nickname || "User"}
                path={data?.avatar_path ?? null}
                version={data?.avatar_version ?? 0}
                size={40}
              />
              <div className="text-xs">
                <div className="font-semibold leading-tight">{nickname || "User"}</div>
                    <div className="text-[10px]">
                        {ready ? (
                            <>
                            {timeLabel} · {dateLabel} <span className="opacity-60">local</span>
                            </>
                        ) : (
                            <span className="opacity-60">—</span>
                        )}
                    </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay на контенте (закрывает по клику) */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed top-0 inset-0 z-40 bg-white/40 backdrop-blur-[1px]"
          onClick={closeMobileSidebar}
        />
      )}
    </>
  );
}