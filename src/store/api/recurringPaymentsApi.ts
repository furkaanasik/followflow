import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type {
  RecurringPayment,
  RecurringPaymentInsert,
  RecurringPaymentUpdate,
} from '@/types';

import { api } from './baseApi';

const notFoundError = new PostgrestError({
  message: 'Row not found or not owned by the current user.',
  details: '',
  hint: '',
  code: 'NOT_FOUND',
});

export const recurringPaymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRecurringPayments: builder.query<RecurringPayment[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .select('*')
          .order('next_payment_date', { ascending: true });
        if (error) return { error };
        return { data };
      },
      providesTags: ['RecurringPayment'],
    }),
    createRecurringPayment: builder.mutation<
      RecurringPayment,
      RecurringPaymentInsert
    >({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['RecurringPayment'],
    }),
    updateRecurringPayment: builder.mutation<
      RecurringPayment,
      { id: string } & RecurringPaymentUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['RecurringPayment'],
    }),
    deleteRecurringPayment: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) return { error };
        if (!data.length) return { error: notFoundError };
        return { data: { id } };
      },
      invalidatesTags: ['RecurringPayment'],
    }),
  }),
});

export const {
  useListRecurringPaymentsQuery,
  useCreateRecurringPaymentMutation,
  useUpdateRecurringPaymentMutation,
  useDeleteRecurringPaymentMutation,
} = recurringPaymentsApi;
