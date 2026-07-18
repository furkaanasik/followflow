import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PostgrestError } from '@supabase/supabase-js';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<PostgrestError>(),
  tagTypes: [
    'IncomeSource',
    'RecurringPayment',
    'Goal',
    'Budget',
    'Transaction',
    'Profile',
  ],
  endpoints: () => ({}),
});
