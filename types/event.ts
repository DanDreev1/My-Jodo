// types/event.ts
export type EventTag =
  | "primary"
  | "secondary"
  | "daily_goal"
  | "unexpected"
  | "fixed";

export type DbEvent = {
  id: string;
  user_id: string;

  title: string;
  description: string | null;

  start_at: string;
  end_at: string | null;

  all_day: boolean;
  tag: EventTag | null;

  location: string | null;

  created_at: string;
  updated_at: string;
};

// ✅ то, что отдаём в UI / API (serializable)
export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;

  // ✅ в UI лучше без null
  description?: string;

  start_at: string;
  end_at: string | null;

  all_day: boolean;
  tag: EventTag | null;

  location?: string;
};