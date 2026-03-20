const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function formatArabicDate(date: Date): string {
  return `${AR_DAYS[date.getDay()]}، ${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRelativeArabic(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} ${mins === 1 ? "دقيقة" : mins === 2 ? "دقيقتين" : mins <= 10 ? "دقائق" : "دقيقة"}`;
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? "ساعة" : hours === 2 ? "ساعتين" : "ساعات"}`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? "أسبوع" : "أسابيع"}`;
  return `منذ ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "شهر" : "أشهر"}`;
}

export function formatArabicTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

export function getArabicDayName(date: Date): string {
  return AR_DAYS[date.getDay()];
}

export function getArabicMonthName(month: number): string {
  return AR_MONTHS[month];
}

export { AR_MONTHS, AR_DAYS };
