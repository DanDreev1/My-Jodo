"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";

import { useProfileIdentity } from "@/hooks/profile/useProfileIdentity.ts";
import { useProfileAvatar } from "@/hooks/profile/useProfileAvatar";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SectionCard } from "@/components/profile/SectionCard";
import { KeyValueRow } from "@/components/profile/KeyValueRow";
import { DangerZone } from "@/components/profile/DangerZone";
import { SkeletonLine } from "@/components/profile/SkeletonLine";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { ConfirmModal } from "@/components/profile/ConfirmModal";
import { ToastProvider } from "@/components/profile/ToastProvider";
import { formatLocalDateTime } from "@/lib/datetime";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const qc = useQueryClient();
  const resetAuth = useAuthStore((s) => s.reset);

  const { user, nickname, email, loading } = useProfileIdentity();

  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const userId = user?.id ?? null;
  const { data: avatar } = useProfileAvatar(userId);

  const confirmLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
        qc.clear();
        resetAuth();
        await supabase.auth.signOut();
        router.replace("/login");
    } finally {
        setLoggingOut(false);
        setConfirmOpen(false);
    }
  };

  useEffect(() => {
    const handler = () => confirmLogout();
    window.addEventListener("app:logout", handler);
    return () => window.removeEventListener("app:logout", handler);
  }, [confirmLogout]);
  
  const createdAt = user?.created_at ? new Date(user.created_at) : null;

  // providers могут быть в identities
  const providers =
    user?.identities?.map((i) => i.provider).filter(Boolean) ?? [];

  const emailVerified = !!user?.email_confirmed_at;

  const lastSignInRaw = (user as any)?.last_sign_in_at as string | undefined;
  const lastSignInLabel = lastSignInRaw ? formatLocalDateTime(lastSignInRaw) : "";

  return (
    <ToastProvider>
        <div className="relative min-h-dvh overflow-x-hidden px-3 py-6 sm:px-4 md:px-10 md:py-10 text-[#251c16]">
            <div className="mx-auto w-full max-w-5xl">

                <ProfileHeader
                    nickname={nickname}
                    isLoading={loading}
                    createdAtLabel={createdAt ? createdAt.toLocaleDateString() : ""}
                    userId={userId}
                    avatarPath={avatar?.avatar_path ?? null}
                    avatarVersion={avatar?.avatar_version ?? 0}
                />

                <div className="mt-6 grid gap-4 md:grid-cols-12 md:gap-6">
                    {/* LEFT */}
                    <div className="md:col-span-7">
                        <SectionCard title="Account" subtitle="Your sign-in details and providers">
                            {loading ? (
                                <div className="space-y-3">
                                    <SkeletonLine />
                                    <SkeletonLine />
                                    <SkeletonLine className="w-2/3" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <KeyValueRow label="Email" value={email || "—"} copyValue={email || undefined} />
                                    <KeyValueRow label="User ID" value={user?.id ?? "—"} copyValue={user?.id ?? undefined} />
                                    <KeyValueRow
                                        label="Created"
                                        value={createdAt ? createdAt.toLocaleString() : "—"}
                                />
                                    <KeyValueRow
                                        label="Providers"
                                        value={providers.length ? providers.join(", ") : "email"}
                                    />
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Quick actions"
                            subtitle="Small helpers that save time"
                            className="mt-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => router.push("/")}
                                    className="rounded-2xl border border-[#251c16]/20 bg-white/60 px-4 py-3 text-left hover:bg-white"
                                >
                                    <p className="text-sm font-semibold">Go to dashboard</p>
                                    <p className="text-xs opacity-70 mt-1">Back to the main app</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push("/themes")}
                                    className="rounded-2xl border border-[#251c16]/20 bg-white/60 px-4 py-3 text-left hover:bg-white"
                                >
                                    <p className="text-sm font-semibold">Settings</p>
                                    <p className="text-xs opacity-70 mt-1">Theme, preferences, and more</p>
                                </button>
                            </div>

                            <p className="mt-4 text-xs opacity-60">
                                Tip: keep this page minimal — profile is usually “view + a few actions”.
                            </p>
                        </SectionCard>
                    </div>

                    {/* RIGHT */}
                    <div className="md:col-span-5 space-y-4">
                        <SecurityCard
                            email={email}
                            emailVerified={emailVerified}
                            lastSignInLabel={lastSignInLabel}
                        />

                        <DangerZone email={email ?? ""} />
                    </div>
                </div>

                <ConfirmModal />
            </div>
        </div>
    </ToastProvider>
  );
}