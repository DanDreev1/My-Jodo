function parseNaiveUtcTimestamp(s: string): Date | null {
  // accepts: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  const m =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(s);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6]);
  const ms = m[7] ? Number((m[7] + "000").slice(0, 3)) : 0;

  return new Date(Date.UTC(year, month, day, hour, minute, second, ms));
}

export function formatLocalDateTime(input: string | number | Date) {
  let d: Date;

  if (input instanceof Date) {
    d = input;
  } else if (typeof input === "string") {
    // if it's ISO with timezone, Date can parse it safely
    // if it's "YYYY-MM-DD HH:mm:ss", treat as UTC explicitly
    d = parseNaiveUtcTimestamp(input) ?? new Date(input);
  } else {
    d = new Date(input);
  }

  if (Number.isNaN(d.getTime())) return "";

  // local timezone is default; no need to set timeZone explicitly
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}