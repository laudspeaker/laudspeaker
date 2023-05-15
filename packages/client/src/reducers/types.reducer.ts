import { Action as ReduxAction } from "redux";
import { ThunkAction } from "redux-thunk";

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  {},
  null,
  ReduxAction<string>
>;
