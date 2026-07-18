import type { Database } from './database';

export type { Database };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type IncomeSource =
  Database['public']['Tables']['income_sources']['Row'];
export type IncomeSourceInsert =
  Database['public']['Tables']['income_sources']['Insert'];
export type IncomeSourceUpdate =
  Database['public']['Tables']['income_sources']['Update'];

export type RecurringPayment =
  Database['public']['Tables']['recurring_payments']['Row'];
export type RecurringPaymentInsert =
  Database['public']['Tables']['recurring_payments']['Insert'];
export type RecurringPaymentUpdate =
  Database['public']['Tables']['recurring_payments']['Update'];

export type Goal = Database['public']['Tables']['goals']['Row'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];

export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert =
  Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate =
  Database['public']['Tables']['transactions']['Update'];
