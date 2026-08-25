/** Date and text helpers. Locale-aware because the site ships EN and DE. */

const MONTH_YEAR: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };

export function formatMonthYear(value: string | null | undefined, locale = "en"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, MONTH_YEAR).format(date);
}

/** A full date, e.g. "18 April 1993" — used for date of birth. */
export function formatFullDate(value: string | null | undefined, locale = "en"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatYear(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

/** "Sep 2022 — Present" */
export function formatRange(
  start: string | null | undefined,
  end: string | null | undefined,
  presentLabel: string,
  locale = "en",
): string {
  const from = formatMonthYear(start, locale);
  const to = end ? formatMonthYear(end, locale) : presentLabel;
  if (!from) return to;
  return `${from} — ${to}`;
}

/** "2 yrs 4 mos", or "" when the dates make no sense. */
export function formatDuration(
  start: string | null | undefined,
  end: string | null | undefined,
  labels: { year: string; years: string; month: string; months: string },
): string {
  if (!start) return "";
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return "";

  const totalMonths =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? labels.year : labels.years}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? labels.month : labels.months}`);
  return parts.join(" ");
}

/** Absolute URL for a media path, so images work against a remote API host. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
