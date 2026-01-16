import { createClient } from "@/lib/supabase/server";
import type { DbEvent, CalendarEvent } from "@/types/event";
import { mapDbEvent } from "@/lib/events/mapEvent";

export async function getEventsForRange(from: Date, to: Date): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .lt("start_at", to.toISOString())
    .gt("end_at", from.toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    console.error("getEventsForRange error:", error);
    return [];
  }

  return ((data ?? []) as DbEvent[]).map(mapDbEvent);
}