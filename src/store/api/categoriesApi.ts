import { supabase } from '@/lib/supabase';
import type {
  UserCategory,
  UserCategoryInsert,
  UserCategoryUpdate,
} from '@/types';

import { api, toApiError, type ApiError } from './baseApi';

const notFoundError: ApiError = {
  code: 'NOT_FOUND',
  message: 'Row not found or not owned by the current user.',
};

export const categoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<UserCategory[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<UserCategory, UserCategoryInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('categories')
          .insert(payload)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<
      UserCategory,
      { id: string } & UserCategoryUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('categories')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) return { error: toApiError(error) };
        if (!data.length) return { error: notFoundError };
        return { data: { id } };
      },
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
