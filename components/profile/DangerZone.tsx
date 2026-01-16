"use client";

import { SectionCard } from "./SectionCard";
import { useConfirmStore } from "@/stores/confirmStore";

export function DangerZone({ email }: { email: string }) {
  const show = useConfirmStore((s) => s.show);

  const requestLogout = () => {
    show({
      title: "Log out?",
      description: `This will clear local cache and return you to the login screen.${email ? ` (${email})` : ""}`,
      confirmText: "Log out",
      cancelText: "Cancel",
      danger: true,
      onConfirm: () => {
        // тут НЕ делаем логаут напрямую, а дергаем глобальный обработчик
        // самый простой путь: диспатчим кастомное событие
        window.dispatchEvent(new Event("app:logout"));
      },
    });
  };

  return (
    <SectionCard title="Danger zone" subtitle="Sensitive actions for this device">
      <div className="rounded-2xl border border-[#c24a36]/25 bg-[#c24a36]/5 p-4">
        <p className="text-sm font-semibold">Log out</p>
        <p className="mt-1 text-xs opacity-75">
          This will clear local cache and return you to the login screen.
          {email ? ` (${email})` : ""}
        </p>

        <button
          type="button"
          onClick={requestLogout}
          className={[
            "mt-4 w-full rounded-2xl py-3 font-alt font-bold text-white",
            "bg-[#c24a36] hover:opacity-95 active:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#251c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          ].join(" ")}
        >
          Log out
        </button>
      </div>
    </SectionCard>
  );
}