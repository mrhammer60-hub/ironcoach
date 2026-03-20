/**
 * All functions accept UTC Date/string, return formatted string in user's timezone.
 * Uses Intl.DateTimeFormat — no external dependencies.
 */

export function formatDate(
  utcDate: Date | string,
  timezone: string,
  locale: "ar" | "en" = "ar",
): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(
  utcDate: Date | string,
  timezone: string,
  locale: "ar" | "en" = "ar",
): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDateTime(
  utcDate: Date | string,
  timezone: string,
  locale: "ar" | "en" = "ar",
): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatRelative(
  utcDate: Date | string,
  _timezone: string,
  locale: "ar" | "en" = "ar",
): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", {
    numeric: "auto",
  });

  const diffMs = date.getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(diffDays, "day");
}

function getTimezoneOffsetMs(timezone: string, date: Date): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: timezone });
  return new Date(utcStr).getTime() - new Date(tzStr).getTime();
}

/**
 * Get the start and end of "today" in the user's timezone, as UTC Dates.
 * Used for "today's workout" queries.
 */
export function getTodayInTimezone(timezone: string): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parseInt(parts.find((p) => p.type === "year")!.value);
  const month = parseInt(parts.find((p) => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")!.value);

  const startLocal = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const endLocal = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

  const offsetMs = getTimezoneOffsetMs(timezone, now);
  return {
    start: new Date(startLocal.getTime() + offsetMs),
    end: new Date(endLocal.getTime() + offsetMs),
  };
}

/**
 * Convert a "local time" like "08:00" in a given timezone to next UTC occurrence.
 * Used for scheduling notifications.
 */
export function nextOccurrenceUTC(
  localTime: string,
  timezone: string,
): Date {
  const [hours, minutes] = localTime.split(":").map(Number);
  const now = new Date();

  const { start } = getTodayInTimezone(timezone);
  const targetUTC = new Date(
    start.getTime() + (hours * 60 + minutes) * 60_000,
  );

  if (targetUTC <= now) {
    targetUTC.setDate(targetUTC.getDate() + 1);
  }

  return targetUTC;
}
