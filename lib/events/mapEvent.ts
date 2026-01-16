// lib/events/mapEvent.ts
import type { DbEvent, CalendarEvent } from "@/types/event";

export function mapDbEvent(e: DbEvent): CalendarEvent {
  return {
    id: e.id,
    user_id: e.user_id,
    title: e.title,

    // ✅ null -> undefined
    description: e.description ?? undefined,

    start_at: e.start_at,
    end_at: e.end_at,

    all_day: e.all_day,
    tag: e.tag,

    location: e.location ?? undefined,
  };
}