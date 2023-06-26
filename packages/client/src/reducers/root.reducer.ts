import { combineReducers } from "redux";
import authReducer from "./auth.reducer";
import commentsReducer from "./comments.reducer";
import flowBuilderReducer from "./flow-builder.reducer";
import onboardingReducer from "./onboarding.reducer";
import segmentReducer from "./segment.reducer";
import settingsReducer from "./settings.reducer";

const rootReducer = combineReducers({
  auth: authReducer,
  comments: commentsReducer,
  flowBuilder: flowBuilderReducer,
  segment: segmentReducer,
  settings: settingsReducer,
  onboarding: onboardingReducer,
});

export default rootReducer;
