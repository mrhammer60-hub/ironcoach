"use client";

import React from "react";
import { formatTime, formatDate, formatRelative } from "@ironcoach/shared";

interface TimeProps {
  utcDate: string | Date;
  timezone?: string;
  locale?: "ar" | "en";
}

const DEFAULT_TZ = "Asia/Riyadh";

export function LocalTime({
  utcDate,
  timezone = DEFAULT_TZ,
  locale = "ar",
}: TimeProps) {
  const iso = new Date(utcDate).toISOString();
  return <time dateTime={iso}>{formatTime(utcDate, timezone, locale)}</time>;
}

export function LocalDate({
  utcDate,
  timezone = DEFAULT_TZ,
  locale = "ar",
}: TimeProps) {
  const iso = new Date(utcDate).toISOString();
  return <time dateTime={iso}>{formatDate(utcDate, timezone, locale)}</time>;
}

export function RelativeTime({
  utcDate,
  timezone = DEFAULT_TZ,
  locale = "ar",
}: TimeProps) {
  const iso = new Date(utcDate).toISOString();
  return (
    <time dateTime={iso} title={formatDate(utcDate, timezone, locale)}>
      {formatRelative(utcDate, timezone, locale)}
    </time>
  );
}
