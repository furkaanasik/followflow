import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IncomeDraft {
  name: string;
  amount: string;
  frequency: string;
  payDay: string;
}

export interface RecurringDraft {
  name: string;
  amount: string;
  frequency: string;
  payDay: string;
}

export interface GoalDraft {
  name: string;
  targetAmount: string;
  savedAmount: string;
}

interface OnboardingState {
  incomeDraft: IncomeDraft;
  recurringDraft: RecurringDraft;
  goalDraft: GoalDraft;
}

const initialState: OnboardingState = {
  incomeDraft: { name: '', amount: '', frequency: 'monthly', payDay: '' },
  recurringDraft: { name: '', amount: '', frequency: 'monthly', payDay: '' },
  goalDraft: { name: '', targetAmount: '', savedAmount: '' },
};

// Onboarding "back" navigation pushes fresh screen instances (see the
// (onboarding) layout), so form drafts live here instead of component state.
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    updateIncomeDraft: (state, action: PayloadAction<Partial<IncomeDraft>>) => {
      Object.assign(state.incomeDraft, action.payload);
    },
    updateRecurringDraft: (
      state,
      action: PayloadAction<Partial<RecurringDraft>>,
    ) => {
      Object.assign(state.recurringDraft, action.payload);
    },
    updateGoalDraft: (state, action: PayloadAction<Partial<GoalDraft>>) => {
      Object.assign(state.goalDraft, action.payload);
    },
    resetOnboardingDrafts: () => initialState,
  },
});

export const {
  updateIncomeDraft,
  updateRecurringDraft,
  updateGoalDraft,
  resetOnboardingDrafts,
} = onboardingSlice.actions;
export default onboardingSlice.reducer;
