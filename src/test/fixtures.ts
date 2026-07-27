import type {
  Budget,
  Goal,
  GoalContribution,
  IncomeSource,
  RecurringPayment,
  Transaction,
} from '@/types';

export const txn = (over: Partial<Transaction> = {}): Transaction => ({
  id: 'txn-1',
  user_id: 'u-1',
  type: 'expense',
  category: 'market',
  icon: 'shopping-cart',
  title: 'Market',
  note: null,
  amount: 0,
  currency: 'TRY',
  occurred_at: '2026-07-15',
  created_at: '2026-07-15',
  updated_at: '2026-07-15',
  ...over,
});

export const budget = (over: Partial<Budget> = {}): Budget => ({
  id: 'bud-1',
  user_id: 'u-1',
  icon: 'shopping-cart',
  category_name: 'market',
  limit_amount: 1000,
  period_month: '2026-07-01',
  currency: 'TRY',
  created_at: '2026-07-01',
  updated_at: '2026-07-01',
  ...over,
});

export const goal = (over: Partial<Goal> = {}): Goal => ({
  id: 'goal-1',
  user_id: 'u-1',
  icon: 'plane',
  name: 'Tatil',
  target_amount: 10000,
  current_amount: 0,
  target_date: null,
  currency: 'TRY',
  created_at: '2026-07-01',
  updated_at: '2026-07-01',
  ...over,
});

export const incomeSource = (
  over: Partial<IncomeSource> = {},
): IncomeSource => ({
  id: 'inc-1',
  user_id: 'u-1',
  name: 'Maaş',
  amount: 0,
  frequency: 'monthly',
  pay_day: null,
  currency: 'TRY',
  created_at: '2026-07-01',
  updated_at: '2026-07-01',
  ...over,
});

export const recurringPayment = (
  over: Partial<RecurringPayment> = {},
): RecurringPayment => ({
  id: 'rp-1',
  user_id: 'u-1',
  icon: 'tv',
  name: 'Netflix',
  amount: 100,
  frequency: 'monthly',
  next_payment_date: '2026-07-20',
  currency: 'TRY',
  created_at: '2026-07-01',
  updated_at: '2026-07-01',
  ...over,
});

export const goalContribution = (
  over: Partial<GoalContribution> = {},
): GoalContribution => ({
  id: 'gc-1',
  user_id: 'u-1',
  goal_id: 'goal-1',
  amount: 0,
  note: null,
  currency: 'TRY',
  occurred_at: '2026-07-15',
  created_at: '2026-07-15',
  ...over,
});
