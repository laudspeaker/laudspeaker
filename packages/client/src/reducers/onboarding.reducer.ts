import { createSlice } from "@reduxjs/toolkit";

interface OnboardingState {
  onboarded: boolean;
  messageSetupped: boolean;
  eventProviderSetupped: boolean;
  userSchemaSetupped: boolean;
}

const initialState: OnboardingState = {
  onboarded: false,
  messageSetupped: false,
  eventProviderSetupped: false,
  userSchemaSetupped: false,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    restoreOnboardingState(state) {
      state.onboarded = false;
      state.messageSetupped = false;
      state.eventProviderSetupped = false;
      state.userSchemaSetupped = false;
    },
    setOnboarded(state, action) {
      state.onboarded = action.payload;
    },
    setUserSchemaSetupped(state, action) {
      state.userSchemaSetupped = action.payload;
    },
    setMessageSetupped(state, action) {
      state.messageSetupped = action.payload;
    },
    setEventProviderSetupped(state, action) {
      state.eventProviderSetupped = action.payload;
    },
  },
});

export const {
  restoreOnboardingState,
  setUserSchemaSetupped,
  setMessageSetupped,
  setEventProviderSetupped,
  setOnboarded,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
