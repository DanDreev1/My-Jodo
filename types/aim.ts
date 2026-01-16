export type AimLevel = "year" | "month" | "week" | "day";
export type AimStatus = "active" | "done" | "not_done" | "failed";

export type Aim = {
  id: string;
  user_id: string;

  level: AimLevel;

  title: string;
  description: string;

  start_at: string | null;
  end_at: string;

  status: AimStatus;
  progress: number;

  manual_override?: boolean;

  created_at: string;
  updated_at: string;
};
