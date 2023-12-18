import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Query, QueryType } from "./flow-builder.reducer";

export interface SegmentsSettings {
  query: Query;
}

interface SegmentState {
  segment: SegmentsSettings;
  availableTags: string[];
  segmentQueryErrors: Record<string, any>;
  showSegmentsErrors: boolean;
}

const defaultSegmentSettingsState = {
  query: {
    type: QueryType.ANY,
    statements: [],
  },
};

const initialState: SegmentState = {
  segment: defaultSegmentSettingsState,
  availableTags: [],
  segmentQueryErrors: {},
  showSegmentsErrors: false,
};

const segmentSettingsSlice = createSlice({
  name: "segmentSettings",
  initialState,
  reducers: {
    setShowSegmentsErrors(state, action: PayloadAction<boolean>) {
      if (!Object.keys(state.segmentQueryErrors).length)
        state.showSegmentsErrors = false;
      else state.showSegmentsErrors = action.payload;
    },
    setSegmentsSettings(state, action: PayloadAction<SegmentsSettings>) {
      state.segment = action.payload;
    },
    addSegmentQueryError(state, action: PayloadAction<string>) {
      state.segmentQueryErrors[action.payload] = true;
    },
    removeSegmentQueryError(state, action: PayloadAction<string>) {
      delete state.segmentQueryErrors[action.payload];
    },
    setAvailableTags(state, action: PayloadAction<string[]>) {
      state.availableTags = action.payload;
    },
    clearSegmentPanelErrors(state) {
      state.segmentQueryErrors = {};
    },
    setSettingsToDefault(state) {
      state.segment = defaultSegmentSettingsState;
    },
  },
});

export const {
  setSegmentsSettings,
  addSegmentQueryError,
  removeSegmentQueryError,
  clearSegmentPanelErrors,
  setShowSegmentsErrors,
  setAvailableTags,
  setSettingsToDefault,
} = segmentSettingsSlice.actions;

export default segmentSettingsSlice.reducer;
