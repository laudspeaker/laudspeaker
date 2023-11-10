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

const initialState: SegmentState = {
  segment: {
    query: {
      type: QueryType.ANY,
      statements: [],
    },
  },
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
  },
});

export const {
  setSegmentsSettings,
  addSegmentQueryError,
  removeSegmentQueryError,
  clearSegmentPanelErrors,
  setShowSegmentsErrors,
  setAvailableTags,
} = segmentSettingsSlice.actions;

export default segmentSettingsSlice.reducer;
