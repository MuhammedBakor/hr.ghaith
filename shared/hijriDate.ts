// ═══ Hijri (Islamic) Calendar Utility ═══
// Converts between Gregorian and Hijri dates for Saudi ERP

/**
 * Convert Gregorian date to approximate Hijri date
 * Uses the Umm al-Qura calendar approximation
 */
export function toHijri(date: Date): { year: number; month: number; day: number; formatted: string } {
  const greg = date.getTime();
  const epoch = new Date(622, 6, 16).getTime(); // Hijri epoch
  
  // Days since Hijri epoch
  const daysSinceEpoch = Math.floor((greg - epoch) / (1000 * 60 * 60 * 24));
  
  // Approximate Hijri year (354.36667 days per Hijri year)
  const hijriYear = Math.floor(daysSinceEpoch / 354.36667) + 1;
  
  // Approximate month and day
  const daysInYear = daysSinceEpoch - Math.floor((hijriYear - 1) * 354.36667);
  const hijriMonth = Math.min(12, Math.floor(daysInYear / 29.5) + 1);
  const hijriDay = Math.min(30, Math.floor(daysInYear - (hijriMonth - 1) * 29.5) + 1);
  
  const monthNames = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
  ];
  
  return {
    year: hijriYear,
    month: hijriMonth,
    day: Math.max(1, hijriDay),
    formatted: `${Math.max(1, hijriDay)} ${monthNames[hijriMonth - 1]} ${hijriYear}هـ`,
  };
}

/**
 * Format date with both Gregorian and Hijri
 */
export function formatDualDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const greg = d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const hijri = toHijri(d);
  return `${greg} (${hijri.formatted})`;
}

/**
 * Get current Hijri date
 */
export function getCurrentHijri(): ReturnType<typeof toHijri> {
  return toHijri(new Date());
}

export default { toHijri, formatDualDate, getCurrentHijri };
