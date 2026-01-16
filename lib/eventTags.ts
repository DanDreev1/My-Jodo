import type { EventTag } from "@/types/event";

export const TAG_COLOR: Record<EventTag, string> = {
  primary: "#E85A4F",
  secondary: "#3B82F6",
  daily_goal: "#22C55E",
  unexpected: "#111827",
  fixed: "#F59E0B",
};

export const TAG_LABEL: Record<EventTag, string> = {
  primary: "Primary Task",
  secondary: "Secondary Task",
  daily_goal: "Daily Goal",
  unexpected: "Unexpected Task",
  fixed: "Fixed / Meeting",
};

export const DEFAULT_TAG: EventTag = "unexpected";