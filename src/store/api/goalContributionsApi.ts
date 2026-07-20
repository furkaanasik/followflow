import { supabase } from '@/lib/supabase';
import type { Goal, GoalContribution } from '@/types';

import { api, toApiError } from './baseApi';

export const goalContributionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listGoalContributions: builder.query<GoalContribution[], string>({
      queryFn: async (goalId) => {
        const { data, error } = await supabase
          .from('goal_contributions')
          .select('*')
          .eq('goal_id', goalId)
          .order('occurred_at', { ascending: true });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['GoalContribution'],
    }),
    depositToGoal: builder.mutation<
      Goal,
      { goal_id: string; amount: number; note?: string | null }
    >({
      queryFn: async ({ goal_id, amount, note = null }) => {
        const { data, error } = await supabase.rpc('add_goal_contribution', {
          p_goal_id: goal_id,
          p_amount: amount,
          p_note: note,
        });
        if (error) return { error: toApiError(error) };
        return { data: data as Goal };
      },
      invalidatesTags: ['Goal', 'GoalContribution'],
    }),
    removeGoalContribution: builder.mutation<Goal, string>({
      queryFn: async (contributionId) => {
        const { data, error } = await supabase.rpc('remove_goal_contribution', {
          p_contribution_id: contributionId,
        });
        if (error) return { error: toApiError(error) };
        return { data: data as Goal };
      },
      invalidatesTags: ['Goal', 'GoalContribution'],
    }),
  }),
});

export const {
  useListGoalContributionsQuery,
  useDepositToGoalMutation,
  useRemoveGoalContributionMutation,
} = goalContributionsApi;
