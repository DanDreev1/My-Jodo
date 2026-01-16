"use client";

export function SectionCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "rounded-2xl sm:rounded-[28px] border border-[#251c16]/15 bg-white/55",
        "p-4 sm:p-5 md:p-6",
        "shadow-[0_18px_60px_-55px_rgba(0,0,0,0.35)] backdrop-blur",
        className ?? "",
      ].join(" ")}
    >
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-alt text-base md:text-lg font-bold">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs md:text-sm opacity-70">{subtitle}</p>
          ) : null}
        </div>
      </header>

      <div className="mt-4">{children}</div>
    </section>
  );
}