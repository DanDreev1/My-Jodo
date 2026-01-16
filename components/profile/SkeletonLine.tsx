"use client";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={[
        "h-4 w-full rounded-xl bg-[#251c16]/10 animate-pulse",
        className ?? "",
      ].join(" ")}
    />
  );
}