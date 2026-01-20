// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-[#FDF4EC]">
      <div className="mx-auto w-[min(1100px,calc(100%-40px))] py-16">
        {/* Hero */}
        <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm text-black/60">Personal Planner</p>

          <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            Calendar, Aims and Notes — in one calm system.
          </h1>

          <p className="mt-4 text-base md:text-lg text-black/70 max-w-[70ch]">
            A personal planner built to turn intentions into scheduled actions:
            plan in Calendar, track goals in Aims, and capture insights & ideas in Notes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full px-6 py-3 bg-black text-white hover:opacity-90"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-full px-6 py-3 border border-black/20 bg-white hover:bg-black/5"
            >
              Create account
            </Link>

            <Link
              href="/calendar"
              className="rounded-full px-6 py-3 border border-black/20 bg-white hover:bg-black/5"
            >
              Open app
            </Link>
          </div>

          <p className="mt-4 text-xs text-black/50">
            “Open app” will redirect to login if you’re not signed in.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            title="Calendar"
            desc="Day / Week / Month / Agenda views with quick event creation."
            bullets={["Fast navigation", "Clear event cards", "Focus on today"]}
          />
          <FeatureCard
            title="Aims"
            desc="Goals on day / week / month / year levels with simple progress tracking."
            bullets={["Finish / Not finish", "Keeps you honest", "Works like a system"]}
          />
          <FeatureCard
            title="Notes"
            desc="Capture Insights, Plans, Ideas and Thoughts on a board-style workspace."
            bullets={["Structured note types", "Quick writing flow", "Keeps context"]}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-black/60">
          Built with Next.js, TypeScript, Tailwind, React Query, Zustand and Supabase.
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  desc,
  bullets,
}: {
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-black/70">{desc}</p>

      <ul className="mt-4 space-y-2 text-sm text-black/70">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black/40" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}