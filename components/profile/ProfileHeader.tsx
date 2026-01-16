"use client";

import { useToast } from "@/hooks/ui/useToast";
import { EditNicknameModal } from "@/components/profile/EditNicknameModal";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { MobileActionsMenu } from "@/components/profile/MobileActionsMenu";
import { useEditNicknameModalStore } from "@/stores/useEditNicknameModalStore";

export function ProfileHeader({
  nickname,
  createdAtLabel,
  isLoading,
  userId,
  avatarPath,
  avatarVersion,
}: {
  nickname: string;
  createdAtLabel: string;
  isLoading: boolean;
  userId: string | null;
  avatarPath: string | null;
  avatarVersion: number;
}) {
  const show = useEditNicknameModalStore((s) => s.show);

  const { toast } = useToast();

  const copyNick = async () => {
    if (!nickname) return;
    try {
        await navigator.clipboard.writeText(nickname);
        toast({ type: "success", title: "Copied", message: "Nickname copied." });
    } catch {
        toast({ type: "error", title: "Copy failed", message: "Could not access clipboard." });
    }
  };

  return (
    <>
        <div className="rounded-2xl sm:rounded-[28px] border border-[#251c16]/15 bg-white/55 p-4 sm:p-5 md:p-6 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                    <AvatarUploader
                        userId={userId}
                        name={nickname || "User"}
                        avatarPath={avatarPath}
                        avatarVersion={avatarVersion}
                        size={44}
                    />
                </div>

                {/* Text + action */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-alt text-base sm:text-lg font-bold leading-tight">
                                Profile
                            </p>

                            {isLoading ? (
                                <p className="mt-1 text-sm opacity-70">Loading…</p>
                            ) : (
                                <div className="mt-2">
                                    {/* Mobile (clean) */}
                                    <div className="sm:hidden">
                                        <p className="text-sm text-[#251c16]/75">
                                            <span className="font-semibold">Hello</span>
                                            <span className="mx-1 opacity-60">—</span>
                                            <span className="font-semibold text-[#251c16]/90 wrap-break-word">
                                            {nickname || "User"}
                                            </span>
                                        </p>

                                        {createdAtLabel ? (
                                            <p className="mt-1 text-xs text-[#251c16]/55">Since {createdAtLabel}</p>
                                        ) : null}
                                    </div>

                                    {/* Desktop (chips) */}
                                    <div className="hidden sm:block">
                                        <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-[#251c16]/10 bg-white/60 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#251c16]/80">
                                            Signed in:
                                        </span>

                                        {nickname ? (
                                            <span className="min-w-0 rounded-full border border-[#251c16]/10 bg-white/70 px-2.5 py-1 text-[12px] font-semibold text-[#251c16]/90">
                                            <span className="break-all">{nickname}</span>
                                            </span>
                                        ) : (
                                            <span className="text-sm opacity-70">—</span>
                                        )}
                                        </div>

                                        {createdAtLabel ? (
                                        <p className="mt-2 text-xs text-[#251c16]/60">
                                            <span className="inline-block rounded-full bg-[#251c16]/10 px-2 py-0.5">
                                            Since {createdAtLabel}
                                            </span>
                                        </p>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Mobile: one menu button */}
                            <MobileActionsMenu
                                nickname={nickname ?? ""}
                                canCopy={!!nickname}
                                disabled={isLoading}
                            />

                            {/* Desktop+: keep full buttons */}
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={copyNick}
                                    disabled={!nickname}
                                    className={[
                                        "shrink-0 rounded-2xl px-3 py-2 text-xs sm:text-sm font-semibold",
                                        "border border-[#251c16]/20 bg-white/70",
                                        "transition-colors duration-150",
                                        "hover:bg-white hover:border-[#251c16]/30",
                                        "active:bg-white/80",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                                        !nickname ? "opacity-50 cursor-not-allowed hover:bg-white/70 hover:border-[#251c16]/20" : "",
                                    ].join(" ")}   
                                >
                                Copy
                                </button>

                                <button
                                    type="button"
                                    onClick={() => show({ initialValue: nickname ?? "" })}
                                    disabled={isLoading}
                                    className={[
                                        "shrink-0 rounded-2xl px-3 py-2 text-xs sm:text-sm font-semibold",
                                        "border border-[#251c16]/20 bg-white/70",
                                        "transition-colors duration-150",
                                        "hover:bg-white hover:border-[#251c16]/30",
                                        "active:bg-white/80",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                                        isLoading ? "opacity-50 cursor-not-allowed" : "",
                                    ].join(" ")}
                                >
                                Edit Nickname
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <EditNicknameModal />
    </>
  );
}