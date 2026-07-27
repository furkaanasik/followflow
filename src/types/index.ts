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

export type GoalContribution =
  Database['public']['Tables']['goal_contributions']['Row'];
export type GoalContributionInsert =
  Database['public']['Tables']['goal_contributions']['Insert'];
export type GoalContributionUpdate =
  Database['public']['Tables']['goal_contributions']['Update'];

export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

export type UserCategory = Database['public']['Tables']['categories']['Row'];
export type UserCategoryInsert =
  Database['public']['Tables']['categories']['Insert'];
export type UserCategoryUpdate =
  Database['public']['Tables']['categories']['Update'];

export type FxRate = Database['public']['Tables']['fx_rates']['Row'];
export type FxRateInsert = Database['public']['Tables']['fx_rates']['Insert'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert =
  Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate =
  Database['public']['Tables']['transactions']['Update'];
