import { combineReducers } from "redux";
import commentReducer from "./comments";
import authReducer from "./auth";
import settingsReducer from "./settings";
import segmentReducer from "./segment";

const reducers = combineReducers({
  comments: commentReducer,
  auth: authReducer,
  settings: settingsReducer,
  segment: segmentReducer,
});

export default reducers;
export type RootState = ReturnType<typeof reducers>;
