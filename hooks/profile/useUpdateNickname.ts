import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const QK = ["profile-identity"] as const;

function deriveNickname(user: any) {
  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const fromMeta =
    meta.nickname || meta.username || meta.display_name || meta.full_name;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  const email = user?.email as string | undefined;
  if (email && email.includes("@")) return email.split("@")[0];
  return "User";
}

export function useUpdateNickname() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["profile", "update-nickname"],
    mutationFn: async (nickname: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { nickname },
      });
      if (error) throw error;
      return data.user;
    },
    onSuccess: (user) => {
      // ✅ мгновенно обновили UI
      qc.setQueryData(QK, () => ({
        user,
        nickname: deriveNickname(user),
        email: user?.email ?? "",
      }));

      // (опционально) можно подстраховаться:
      // qc.invalidateQueries({ queryKey: QK });
    },
  });
}