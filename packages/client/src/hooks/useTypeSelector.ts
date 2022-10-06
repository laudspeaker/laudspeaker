// We need this to use useSelector  (You can Export this as a react-hook to use separately)
import { useSelector, TypedUseSelectorHook } from "react-redux";
import { RootState } from "../reducers";
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
