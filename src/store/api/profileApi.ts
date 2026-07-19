import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types';

import { api, toApiError, type ApiError } from './baseApi';

const notAuthenticatedError: ApiError = {
  code: 'AUTH',
  message: 'Not authenticated.',
};

// Signals that the stored session is definitively dead (user deleted, token
// rejected, profile row gone) as opposed to a transient network failure.
// RootNavigator only signs the user out on this code.
export const AUTH_INVALID_CODE = 'AUTH_INVALID';

const authInvalidError: ApiError = {
  code: AUTH_INVALID_CODE,
  message: 'Session is no longer valid.',
};

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      queryFn: async () => {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          if (userError.status === 401 || userError.status === 403)
            return { error: authInvalidError };
          return { error: toApiError(userError) };
        }
        if (!userData.user) return { error: authInvalidError };

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        // PGRST116 = zero rows: the profile itself is gone, not a blip.
        if (error)
          return {
            error:
              error.code === 'PGRST116' ? authInvalidError : toApiError(error),
          };
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
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi;
