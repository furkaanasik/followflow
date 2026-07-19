import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { api } from './api/baseApi';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import onboardingReducer from './slices/onboardingSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    onboarding: onboardingReducer,
    theme: themeReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
