import { Dispatch } from "redux";
import { ApiConfig } from "../constants";
import ApiService from "../services/api.service";
import posthog from "posthog-js";

export enum ActionType {
  SET_SEGMENT_NAME = "SET_SEGMENT_NAME",
  SET_SEGMENT_DESCRIPTION = "SET_SEGMENT_DESCRIPTION",
  SET_IS_DYNAMIC = "SET_IS_DYNAMIC",
  SET_INCLUSION_CRITERIA = "SET_INCLUSION_CRITERIA",
}

interface ISetSegmentName {
  type: ActionType.SET_SEGMENT_NAME;
  payload: string;
}

interface ISetSegmentDescription {
  type: ActionType.SET_SEGMENT_DESCRIPTION;
  payload: string;
}

interface ISetIsDynamic {
  type: ActionType.SET_IS_DYNAMIC;
  payload: boolean;
}

interface ISetInclusionCriteriaData {
  type: ActionType.SET_INCLUSION_CRITERIA;
  payload: object;
}

export type Action =
  | ISetSegmentName
  | ISetSegmentDescription
  | ISetIsDynamic
  | ISetInclusionCriteriaData;

export interface SegmentData {
  name?: string;
  description?: string;
  inclusionCriteria?: object;
  isDynamic?: boolean;
}

// interface State {
//   settings: SegmentData;
// }

const initialState = {
  name: "",
  description: "",
  inclusionCriteria: {},
  isDynamic: false,
};

const segmentReducer = (state: SegmentData = initialState, action: Action) => {
  switch (action.type) {
    case ActionType.SET_SEGMENT_NAME:
      return {
        ...state,
        name: action.payload,
      };

    case ActionType.SET_SEGMENT_DESCRIPTION:
      return {
        ...state,
        description: action.payload,
      };

    case ActionType.SET_IS_DYNAMIC:
      return { ...state, isDynamic: action.payload };

    case ActionType.SET_INCLUSION_CRITERIA:
      return { ...state, inclusionCriteria: action.payload };

    default:
      return state;
  }
};

export default segmentReducer;

export const setSegmentName = (payload: any): any => {
  return (dispatch: Dispatch<Action>) => {
    dispatch({
      type: ActionType.SET_SEGMENT_NAME,
      payload: payload,
    });
  };
};

export const setSegmentDescription = (payload: any): any => {
  return (dispatch: Dispatch<Action>) => {
    dispatch({
      type: ActionType.SET_SEGMENT_DESCRIPTION,
      payload: payload,
    });
  };
};

export const setSegmentIsDynamic = (payload: any): any => {
  return (dispatch: Dispatch<Action>) => {
    dispatch({
      type: ActionType.SET_IS_DYNAMIC,
      payload: payload,
    });
  };
};

export const setSegmentCriteria = (payload: any): any => {
  return (dispatch: Dispatch<Action>) => {
    dispatch({
      type: ActionType.SET_INCLUSION_CRITERIA,
      payload: payload,
    });
  };
};

export const createSegment = (body: any): any => {
  return async () => {
    try {
      const { data, status } = await ApiService.post({
        url: `${ApiConfig.createSegment}`,
        options: {
          ...body,
        },
      });
      return {
        data,
        status,
      };
    } catch (err: any) {
      posthog.capture("segmentError", {
        segmentError: err.message,
      });
      return {
        err,
      };
    }
  };
};

export const updateSegment = (body: any): any => {
  return async () => {
    try {
      const { data, status } = await ApiService.post({
        url: `${ApiConfig.createSegment}`,
        options: {
          ...body,
        },
      });
      return {
        data,
        status,
      };
    } catch (err: any) {
      return {
        err,
      };
    }
  };
};
