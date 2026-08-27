const PERU_TIME_ZONE = "America/Lima";
const HAS_TIME_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

// Backend timestamps are stored in UTC as LocalDateTime strings. Treat strings
// without an offset as UTC, then render them explicitly in Peru time.
export function backendDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(HAS_TIME_ZONE.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPeruDateTime(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  const date = backendDate(value);
  if (!date) return "—";
  return date.toLocaleString("es-PE", {
    timeZone: PERU_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
    ...options,
  });
}

export function formatPeruDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  const date = backendDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("es-PE", { timeZone: PERU_TIME_ZONE, ...options });
}

export function formatPeruTime(value: string | null | undefined) {
  const date = backendDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("es-PE", { timeZone: PERU_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
}

export function peruTodayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: PERU_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
