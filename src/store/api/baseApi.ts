import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// RTK Query stores errors in Redux state, which must stay serializable —
// class instances like PostgrestError (extends Error) trip the serializable
// state invariant middleware. All endpoints return this plain shape instead.
export interface ApiError {
  code: string;
  message: string;
}

export function toApiError(error: {
  code?: string | null;
  message: string;
}): ApiError {
  return { code: error.code ?? 'UNKNOWN', message: error.message };
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiError>(),
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
