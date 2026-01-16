import { NoteType } from "@/types/note";

export const NOTE_TYPE_META: Record<
  NoteType,
  { label: string; color: string }
> = {
  insight: {
    label: "Insight",
    color: "#D3CEDB", // ты указал — оставляем
  },
  thoughts: {
    label: "Thoughts",
    color: "#005EF0",
  },
  idea: {
    label: "Idea",
    color: "#B89400",
  },
  plan: {
    label: "Plan",
    color: "#00D600",
  },
};