import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { getDeviceLanguage, type Language } from '@/i18n';

interface LanguageState {
  language: Language;
}

// Seed with the device language (what i18n was initialized with) — a static
// fallback here would briefly force i18n back to 'tr' on non-Turkish devices
// until AsyncStorage hydration lands.
const initialState: LanguageState = {
  language: getDeviceLanguage(),
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
