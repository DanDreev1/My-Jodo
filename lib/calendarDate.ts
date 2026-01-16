export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDayLabel(d: Date) {
  // "19 Nov"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function formatMonthLabel(d: Date) {
  // "November 2025"
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function startOfWeekMonday(d: Date) {
  // Monday as start
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun,1=Mon...
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function formatWeekRangeLabel(anchorDate: Date) {
  // "17–23 November 2025" или "17 Nov – 23 Nov 2025"
  const start = startOfWeekMonday(anchorDate);
  const end = addDays(start, 6);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    // "17–23 November 2025"
    const left = start.toLocaleDateString("en-GB", { day: "2-digit" });
    const right = end.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    return `${left}–${right}`;
  }

  // "27 Nov 2025 – 03 Dec 2025"
  const left = start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const right = end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${left} – ${right}`;
}