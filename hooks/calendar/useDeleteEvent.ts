import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userRes.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("user_id", userRes.user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["events"], exact: false });
      qc.removeQueries({ queryKey: ["event", id], exact: true });
    },
  });
}
