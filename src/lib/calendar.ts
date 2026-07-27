import type { IncomeSource, RecurringPayment, Transaction } from '@/types';

export type CalendarMarker = 'payment' | 'payday' | 'expense' | 'income';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
  isToday: boolean;
  markers: CalendarMarker[];
  net: number;
}

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  kind: 'payment' | 'payday' | 'transaction';
  label: string;
  icon: string;
  amount: number;
  currency: string;
  sign: -1 | 0 | 1;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function buildMonthMatrix(
  year: number,
  month: number,
  ref = new Date(),
): CalendarDay[] {
  const first = new Date(year, month, 1);
  // Monday-first: shift Sunday-based getDay() so Monday=0
  const lead = (first.getDay() + 6) % 7;
  const todayKey = toDateString(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
  );

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, i - lead + 1);
    const date = toDateString(d.getFullYear(), d.getMonth(), d.getDate());
    days.push({
      date,
      day: d.getDate(),
      inMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday: date === todayKey,
      markers: [],
      net: 0,
    });
  }
  return days;
}

const FREQUENCY_STEP_DAYS: Partial<
  Record<RecurringPayment['frequency'], number>
> = {
  weekly: 7,
  biweekly: 14,
};

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function expandRecurring(
  payments: RecurringPayment[],
  year: number,
  month: number,
): CalendarEvent[] {
  const target = monthIndex(year, month);
  const events: CalendarEvent[] = [];

  for (const payment of payments) {
    const anchor = new Date(payment.next_payment_date);
    const anchorYear = anchor.getFullYear();
    const anchorMonth = anchor.getMonth();
    const anchorDay = anchor.getDate();

    const push = (day: number) => {
      events.push({
        date: toDateString(year, month, day),
        kind: 'payment',
        label: payment.name,
        icon: payment.icon,
        amount: payment.amount,
        currency: payment.currency,
        sign: -1,
      });
    };

    const stepDays = FREQUENCY_STEP_DAYS[payment.frequency];
    if (stepDays != null) {
      // Walk from the anchor to every occurrence landing in the target month.
      const monthStart = new Date(year, month, 1).getTime();
      const monthEnd = new Date(year, month + 1, 1).getTime();
      const stepMs = stepDays * 86_400_000;
      const anchorMs = new Date(anchorYear, anchorMonth, anchorDay).getTime();
      const offset = Math.ceil((monthStart - anchorMs) / stepMs);
      let t = anchorMs + offset * stepMs;
      while (t < monthEnd) {
        const d = new Date(t);
        push(d.getDate());
        t += stepMs;
      }
    } else if (payment.frequency === 'monthly') {
      push(Math.min(anchorDay, daysInMonth(year, month)));
    } else if (payment.frequency === 'yearly') {
      if (anchorMonth === month) {
        push(Math.min(anchorDay, daysInMonth(year, month)));
      }
    } else if (
      payment.frequency === 'one-time' &&
      monthIndex(anchorYear, anchorMonth) === target
    ) {
      push(anchorDay);
    }
  }
  return events;
}

export function payDayEvents(
  sources: IncomeSource[],
  year: number,
  month: number,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const source of sources) {
    if (source.pay_day == null || source.frequency === 'one-time') continue;
    events.push({
      date: toDateString(
        year,
        month,
        Math.min(source.pay_day, daysInMonth(year, month)),
      ),
      kind: 'payday',
      label: source.name,
      icon: 'briefcase',
      amount: source.amount,
      currency: source.currency,
      sign: 1,
    });
  }
  return events;
}

export function transactionEvents(
  txns: Transaction[],
  year: number,
  month: number,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const txn of txns) {
    const d = new Date(txn.occurred_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    events.push({
      date: toDateString(year, month, d.getDate()),
      kind: 'transaction',
      label: txn.title,
      icon: txn.icon,
      amount: txn.amount,
      currency: txn.currency,
      sign: txn.type === 'income' ? 1 : -1,
    });
  }
  return events;
}

export interface CalendarMonthArgs {
  recurring: RecurringPayment[];
  income: IncomeSource[];
  txns: Transaction[];
  year: number;
  month: number;
  ref?: Date;
}

export interface CalendarMonth {
  days: CalendarDay[];
  events: CalendarEvent[];
}

export function calendarMonth({
  recurring,
  income,
  txns,
  year,
  month,
  ref = new Date(),
}: CalendarMonthArgs): CalendarMonth {
  const days = buildMonthMatrix(year, month, ref);
  const events = [
    ...expandRecurring(recurring, year, month),
    ...payDayEvents(income, year, month),
    ...transactionEvents(txns, year, month),
  ];

  const byDate = new Map<string, CalendarDay>();
  for (const day of days) {
    if (day.inMonth) byDate.set(day.date, day);
  }
  for (const event of events) {
    const day = byDate.get(event.date);
    if (!day) continue;
    const marker: CalendarMarker =
      event.kind === 'payment'
        ? 'payment'
        : event.kind === 'payday'
          ? 'payday'
          : event.sign > 0
            ? 'income'
            : 'expense';
    if (!day.markers.includes(marker)) day.markers.push(marker);
    if (event.kind === 'transaction') day.net += event.sign * event.amount;
  }
  return { days, events };
}

export function eventsForDay(
  events: CalendarEvent[],
  dateISO: string,
): CalendarEvent[] {
  return events.filter((event) => event.date === dateISO);
}
