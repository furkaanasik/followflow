import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types';

import { api } from './baseApi';

const notAuthenticatedError = new PostgrestError({
  message: 'Not authenticated.',
  details: '',
  hint: '',
  code: 'AUTH',
});

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      queryFn: async () => {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user)
          return { error: notAuthenticatedError };

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        if (error) return { error };
        return { data };
      },
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<Profile, ProfileUpdate>({
      queryFn: async (changes) => {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user)
          return { error: notAuthenticatedError };

        const { data, error } = await supabase
          .from('profiles')
          .update(changes)
          .eq('id', userData.user.id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi;
