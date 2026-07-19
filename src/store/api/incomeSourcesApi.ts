import { supabase } from '@/lib/supabase';
import type {
  IncomeSource,
  IncomeSourceInsert,
  IncomeSourceUpdate,
} from '@/types';

import { api, toApiError, type ApiError } from './baseApi';

const notFoundError: ApiError = {
  code: 'NOT_FOUND',
  message: 'Row not found or not owned by the current user.',
};

export const incomeSourcesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listIncomeSources: builder.query<IncomeSource[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('income_sources')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['IncomeSource'],
    }),
    createIncomeSource: builder.mutation<IncomeSource, IncomeSourceInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('income_sources')
          .insert(payload)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['IncomeSource'],
    }),
    updateIncomeSource: builder.mutation<
      IncomeSource,
      { id: string } & IncomeSourceUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('income_sources')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['IncomeSource'],
    }),
    deleteIncomeSource: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('income_sources')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) return { error: toApiError(error) };
        if (!data.length) return { error: notFoundError };
        return { data: { id } };
      },
      invalidatesTags: ['IncomeSource'],
    }),
  }),
});

export const {
  useListIncomeSourcesQuery,
  useCreateIncomeSourceMutation,
  useUpdateIncomeSourceMutation,
  useDeleteIncomeSourceMutation,
} = incomeSourcesApi;
