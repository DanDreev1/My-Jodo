"use client";

import { useMemo, useState } from "react";
import { SectionCard } from "./SectionCard";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";
import { useToast } from "@/hooks/ui/useToast";

export function SecurityCard({
  email,
  emailVerified,
  lastSignInLabel,
}: {
  email: string;
  emailVerified: boolean;
  lastSignInLabel: string;
}) {
  const { mutateAsync, isPending } = usePasswordReset();
  const [status, setStatus] = useState<null | { type: "ok" | "err"; text: string }>(null);

  const canReset = useMemo(() => !!email && email.includes("@"), [email]);

  const { toast } = useToast();

  const onReset = async () => {
    if (!canReset || isPending) return;

    try {
        await mutateAsync(email);
        toast({
        type: "success",
        title: "Email sent",
        message: "Password reset email sent. Check inbox and spam.",
        durationMs: 2600,
        });
    } catch (e: any) {
        toast({
        type: "error",
        title: "Failed",
        message: e?.message ? String(e.message) : "Failed to send reset email.",
        durationMs: 3200,
        });
    }
  };

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <SectionCard title="Security" subtitle="Account status and password help">
      <div className="space-y-3">
        <div className="rounded-2xl border border-[#251c16]/10 bg-white/50 px-4 py-3">
          <p className="text-xs opacity-60">Email status</p>
          <p className="mt-1 text-sm font-semibold">
            {emailVerified ? "Verified" : "Not verified"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#251c16]/10 bg-white/50 px-4 py-3">
          <p className="text-xs opacity-60">Last sign-in</p>
          <p className="mt-1 text-sm font-semibold">{lastSignInLabel} ({tz})</p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={!canReset || isPending}
          className={[
            "w-full rounded-2xl px-4 py-3 text-sm font-semibold",
            "border border-[#251c16]/20 bg-white/60",
            "transition-colors duration-150",
            "hover:bg-white hover:border-[#251c16]/30",
            "active:bg-white/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            (!canReset || isPending) ? "opacity-60 cursor-not-allowed hover:bg-white/60 hover:border-[#251c16]/20" : "",
          ].join(" ")}
        >
          {isPending ? "Sending…" : "Send password reset email"}
        </button>

        {status ? (
          <div
            className={[
              "rounded-2xl border p-3 text-xs",
              status.type === "ok"
                ? "border-[#0f766e]/25 bg-[#0f766e]/10"
                : "border-[#c24a36]/25 bg-[#c24a36]/10",
            ].join(" ")}
          >
            {status.text}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}