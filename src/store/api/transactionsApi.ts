import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
} from '@/types';

import { api } from './baseApi';

const notFoundError = new PostgrestError({
  message: 'Row not found or not owned by the current user.',
  details: '',
  hint: '',
  code: 'NOT_FOUND',
});

export const transactionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTransactions: builder.query<Transaction[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('occurred_at', { ascending: false });
        if (error) return { error };
        return { data };
      },
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation<Transaction, TransactionInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Transaction'],
    }),
    updateTransaction: builder.mutation<
      Transaction,
      { id: string } & TransactionUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('transactions')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Transaction'],
    }),
    deleteTransaction: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) return { error };
        if (!data.length) return { error: notFoundError };
        return { data: { id } };
      },
      invalidatesTags: ['Transaction'],
    }),
  }),
});

export const {
  useListTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi;
