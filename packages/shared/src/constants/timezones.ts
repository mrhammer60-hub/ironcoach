export const SUPPORTED_TIMEZONES = [
  { value: "Asia/Riyadh", label: "الرياض (GMT+3)", offset: "+03:00" },
  { value: "Asia/Dubai", label: "دبي (GMT+4)", offset: "+04:00" },
  { value: "Africa/Cairo", label: "القاهرة (GMT+2)", offset: "+02:00" },
  { value: "Asia/Kuwait", label: "الكويت (GMT+3)", offset: "+03:00" },
  { value: "Asia/Bahrain", label: "البحرين (GMT+3)", offset: "+03:00" },
  { value: "Asia/Qatar", label: "قطر (GMT+3)", offset: "+03:00" },
  { value: "Europe/London", label: "لندن (GMT+0/+1)", offset: "+00:00" },
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number]["value"];
