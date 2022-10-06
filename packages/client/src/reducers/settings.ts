import { Dispatch } from "redux";
import { ApiConfig } from "../constants";
import ApiService from "../services/api.service";
import { AuthAction, ActionType } from "./auth";

export enum SettingsActionType {
  SET_SETTINGS_DATA = "SET_SETTINGS_DATA",
  RESET_SETTINGS_DATA = "RESET_SETTINGS_DATA",
  SET_SETTINGS_PRIVATE_API_KEY = "SET_SETTINGS_PRIVATE_API_KEY",
  SET_DOMAINS_LIST = "SET_DOMAINS_LIST",
}

interface setSettingsData {
  type: SettingsActionType.SET_SETTINGS_DATA;
  payload: SettingsData;
}

interface resetSettingData {
  type: SettingsActionType.RESET_SETTINGS_DATA;
}

interface setPrivateApiKeyData {
  type: SettingsActionType.SET_SETTINGS_PRIVATE_API_KEY;
  payload: string;
}

interface setDomainsListData {
  type: SettingsActionType.SET_DOMAINS_LIST;
  payload: Array<any>;
}

export type SettingsAction =
  | setSettingsData
  | resetSettingData
  | setPrivateApiKeyData
  | setDomainsListData;

export interface SettingsData {
  friendsList?: string;
  channel?: any;
  eventProvider?: any;
  domainName?: any;
  emailList?: string;
  defaultName?: string;
  defaultEmail?: string;
  privateApiKey?: string;
  domainsList?: any;
}

export interface SettingsState {
  settings: SettingsData;
  domainsList?: Array<any>;
}

const initialState = {
  settings: {
    channel: null,
    friendsList: "",
    eventProvider: null,
    domainName: null,
    emailList: "",
    defaultEmail: "",
    defaultName: "",
    privateApiKey: "",
    domainsList: [],
  },
  domainsList: [],
};

const settingsReducer = (
  state: SettingsState = initialState,
  action: SettingsAction
) => {
  switch (action.type) {
    case SettingsActionType.SET_SETTINGS_DATA:
      return {
        ...state,
        settings: action.payload,
      };

    case SettingsActionType.RESET_SETTINGS_DATA:
      return initialState;

    case SettingsActionType.SET_SETTINGS_PRIVATE_API_KEY:
      return { ...state, privateApiKey: action.payload };

    case SettingsActionType.SET_DOMAINS_LIST:
      return { ...state, domainsList: action.payload };

    default:
      return state;
  }
};

export default settingsReducer;

export const setSettingData = (payload: any): any => {
  return (dispatch: Dispatch<SettingsAction>) => {
    dispatch({
      type: SettingsActionType.SET_SETTINGS_DATA,
      payload: payload,
    });
  };
};

export const resetSetttingsData = (): any => {
  return (dispatch: Dispatch<SettingsAction>) => {
    dispatch({
      type: SettingsActionType.RESET_SETTINGS_DATA,
    });
  };
};

export const setSettingsPrivateApiKey = (payload: any): any => {
  return (dispatch: Dispatch<SettingsAction>) => {
    dispatch({
      type: SettingsActionType.SET_SETTINGS_PRIVATE_API_KEY,
      payload: payload,
    });
  };
};

export const setDomainsList = (body: any): any => {
  return async (dispatch: Dispatch<SettingsAction>) => {
    try {
      const { data, status } = await ApiService.get({
        url: `${ApiConfig.domains}/${body}`,
      });
      dispatch({
        type: SettingsActionType.SET_DOMAINS_LIST,
        payload: data,
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

export const updateUserData = (body: any): any => {
  return async (dispatch: Dispatch<AuthAction>) => {
    try {
      const { data, status } = await ApiService.patch({
        url: `${ApiConfig.updateUserInfo}/`,
        options: {
          ...body,
        },
      });
      dispatch({
        type: ActionType.UPDATE_USER_INFO,
        payload: {
          onboarded: data.onboarded,
          firstName: data.firstName,
          lastName: data.lastName,
          uId: data.id,
          email: data.email,
          expectedOnboarding: data.expectedOnboarding,
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
