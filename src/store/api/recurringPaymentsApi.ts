import { supabase } from '@/lib/supabase';
import type {
  RecurringPayment,
  RecurringPaymentInsert,
  RecurringPaymentUpdate,
} from '@/types';

import { api, toApiError, type ApiError } from './baseApi';

const notFoundError: ApiError = {
  code: 'NOT_FOUND',
  message: 'Row not found or not owned by the current user.',
};

export const recurringPaymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRecurringPayments: builder.query<RecurringPayment[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .select('*')
          .order('next_payment_date', { ascending: true });
        if (error) return { error: toApiError(error) };
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
        if (error) return { error: toApiError(error) };
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
        if (error) return { error: toApiError(error) };
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
        if (error) return { error: toApiError(error) };
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
