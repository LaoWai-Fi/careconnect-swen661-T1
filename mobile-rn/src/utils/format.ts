// Formatting helpers — pure functions shared across screens.

/** Formats a Date as CareConnect's "8:30 am" clock-time style — shared by
 * activity-log entries and message timestamps. Pure so it can be unit tested
 * directly against fixed times (midnight/noon/AM/PM boundaries). */
export function formatClockTime(now: Date): string {
  const hour12 = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hour12}:${minutes} ${now.getHours() < 12 ? 'am' : 'pm'}`;
}
