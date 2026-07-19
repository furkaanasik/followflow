import { supabase } from '@/lib/supabase';
import type { Budget, BudgetInsert, BudgetUpdate } from '@/types';

import { api, toApiError, type ApiError } from './baseApi';

const notFoundError: ApiError = {
  code: 'NOT_FOUND',
  message: 'Row not found or not owned by the current user.',
};

export const budgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBudgets: builder.query<Budget[], string | void>({
      queryFn: async (periodMonth) => {
        let query = supabase.from('budgets').select('*');
        if (periodMonth) query = query.eq('period_month', periodMonth);
        const { data, error } = await query.order('category_name', {
          ascending: true,
        });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['Budget'],
    }),
    createBudget: builder.mutation<Budget, BudgetInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('budgets')
          .insert(payload)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Budget'],
    }),
    updateBudget: builder.mutation<Budget, { id: string } & BudgetUpdate>({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('budgets')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Budget'],
    }),
    deleteBudget: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('budgets')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) return { error: toApiError(error) };
        if (!data.length) return { error: notFoundError };
        return { data: { id } };
      },
      invalidatesTags: ['Budget'],
    }),
  }),
});

export const {
  useListBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetsApi;
