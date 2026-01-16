type AimChild = {
  id: string;
  end_at: string;
  status: "active" | "done" | "not_done" | "failed" | string;
  level: "day" | "week" | "month" | string;
};

type LinkRow = {
  parent_id: string;
  child: AimChild | null;
};

function dayKeyLocalFromISO(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Week progress:
 * - группируем day-children по dayKey (YYYY-MM-DD local)
 * - день "засчитан", если ВСЕ цели в этом dayKey имеют status=done
 * - 5 засчитанных дней = 100%
 * - показываем постепенный прогресс: 0/20/40/60/80/100
 */
export function computeWeekProgress(
  weekId: string,
  links: LinkRow[],
  thresholdDays = 5
) {
  const children = links
    .filter((r) => r.parent_id === weekId)
    .map((r) => r.child)
    .filter((c): c is AimChild => !!c && c.level === "day");

  if (children.length === 0) {
    return { doneUnits: 0, totalUnits: thresholdDays, progress: 0, isComplete: false };
  }

  const byDay = new Map<string, AimChild[]>();
  for (const c of children) {
    const k = dayKeyLocalFromISO(c.end_at);
    const arr = byDay.get(k) ?? [];
    arr.push(c);
    byDay.set(k, arr);
  }

  let doneDays = 0;
  for (const arr of byDay.values()) {
    const allDone = arr.every((a) => a.status === "done");
    if (allDone) doneDays += 1;
  }

  const capped = Math.min(doneDays, thresholdDays);
  const progress = Math.round((capped / thresholdDays) * 100);
  return {
    doneUnits: capped,
    totalUnits: thresholdDays,
    progress,
    isComplete: doneDays >= thresholdDays,
  };
}

/**
 * Month progress:
 * - считаем done недель среди week-children (по status===done ИЛИ progress===100 если хочешь)
 * - 3 done недели = 100%
 */
export function computeMonthProgress(
  monthId: string,
  links: LinkRow[],
  thresholdWeeks = 3
) {
  const children = links
    .filter((r) => r.parent_id === monthId)
    .map((r) => r.child)
    .filter((c): c is AimChild => !!c && c.level === "week");

  const doneWeeks = children.filter((w) => w.status === "done").length;
  const capped = Math.min(doneWeeks, thresholdWeeks);
  const progress = Math.round((capped / thresholdWeeks) * 100);

  return {
    doneUnits: capped,
    totalUnits: thresholdWeeks,
    progress,
    isComplete: doneWeeks >= thresholdWeeks,
  };
}
