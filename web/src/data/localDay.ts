/** Calendar keys follow the user's local care-plan day, not UTC or module load time. */
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function localDayOffset(days: number, date = new Date()): string {
  const target = new Date(date);
  target.setDate(target.getDate() + days);
  return localDay(target);
}
