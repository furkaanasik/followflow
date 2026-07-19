import { supabase } from '@/lib/supabase';
import type { Goal, GoalInsert, GoalUpdate } from '@/types';

import { api, toApiError, type ApiError } from './baseApi';

const notFoundError: ApiError = {
  code: 'NOT_FOUND',
  message: 'Row not found or not owned by the current user.',
};

export const goalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listGoals: builder.query<Goal[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['Goal'],
    }),
    createGoal: builder.mutation<Goal, GoalInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('goals')
          .insert(payload)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Goal'],
    }),
    updateGoal: builder.mutation<Goal, { id: string } & GoalUpdate>({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('goals')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Goal'],
    }),
    deleteGoal: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('goals')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) return { error: toApiError(error) };
        if (!data.length) return { error: notFoundError };
        return { data: { id } };
      },
      invalidatesTags: ['Goal'],
    }),
  }),
});

export const {
  useListGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} = goalsApi;
