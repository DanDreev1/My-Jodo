"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) return setError(error.message);

    // Если включён email confirmation — пользователь не залогинится сразу.
    // Для MVP можно выключить confirmation в Supabase Auth settings.
    router.replace("/calendar");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#f9f0e6] text-[#251c16]">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-[#251c16]/30 bg-white/40 p-8">
        <h1 className="font-alt text-2xl font-extrabold">Create account</h1>
        <p className="font-sans text-sm opacity-70 mt-1">Email + password</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="font-alt text-sm">Email</label>
            <input
              className="mt-2 w-full rounded-2xl border border-[#251c16]/25 bg-white/50 px-4 py-3 font-sans outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="font-alt text-sm">Password</label>
            <input
              className="mt-2 w-full rounded-2xl border border-[#251c16]/25 bg-white/50 px-4 py-3 font-sans outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600 font-sans">{error}</div>}

          <button
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-[#c24a36] py-3 font-alt font-bold text-white disabled:opacity-60"
          >
            {loading ? "Creating..." : "Register"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-2xl border border-[#251c16]/25 py-3 font-alt font-semibold"
          >
            Back to login
          </button>
        </div>
      </form>
    </div>
  );
}
