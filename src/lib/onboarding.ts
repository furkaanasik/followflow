function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function computeNextPaymentDate(
  dayOfMonth: number,
  today = new Date(),
): string {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(dayOfMonth, daysInThisMonth);
  const candidate = new Date(year, month, clampedDay);
  if (candidate < new Date(year, month, today.getDate())) {
    const daysInNextMonth = new Date(year, month + 2, 0).getDate();
    const next = new Date(year, month + 1, 1); // normalizes Dec→Jan year rollover
    return toDateString(
      next.getFullYear(),
      next.getMonth(),
      Math.min(dayOfMonth, daysInNextMonth),
    );
  }
  return toDateString(year, month, clampedDay);
}
