import { createSlice } from "@reduxjs/toolkit";

interface OnboardingState {
  onboarded: boolean;
  messageSetupped: boolean;
}

const initialState: OnboardingState = {
  onboarded: false,
  messageSetupped: false,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    restoreOnboardingState(state) {
      state.onboarded = false;
      state.messageSetupped = false;
    },
  },
});

export const { restoreOnboardingState } = onboardingSlice.actions;

export default onboardingSlice.reducer;
