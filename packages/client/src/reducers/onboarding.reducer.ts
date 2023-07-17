import { createSlice } from "@reduxjs/toolkit";

interface OnboardingState {
  onboarded: boolean;
  messageSetupped: boolean;
  eventProviderSetupped: boolean;
}

const initialState: OnboardingState = {
  onboarded: false,
  messageSetupped: false,
  eventProviderSetupped: false,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    restoreOnboardingState(state) {
      state.onboarded = false;
      state.messageSetupped = false;
      state.eventProviderSetupped = false;
    },
  },
});

export const { restoreOnboardingState } = onboardingSlice.actions;

export default onboardingSlice.reducer;
