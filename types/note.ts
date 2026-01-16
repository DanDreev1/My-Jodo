export type NoteType = "insight" | "thoughts" | "idea" | "plan";

export type NoteRow = {
  id: string;
  user_id: string;
  type: NoteType;
  title: string;
  payload: Record<string, any>;
  x: number;
  y: number;
  created_at: string;
  updated_at: string;
};