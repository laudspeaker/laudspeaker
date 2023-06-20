import { configureStore } from "@reduxjs/toolkit";
import auth from "reducers/auth.reducer";
import comments from "reducers/comments.reducer";
import flowBuilder from "reducers/flow-builder.reducer";
import rootReducer from "reducers/root.reducer";
import segment from "reducers/segment.reducer";
import settings from "reducers/settings.reducer";

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
