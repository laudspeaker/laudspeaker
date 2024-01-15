import { Dispatch } from "redux";
import { ApiConfig } from "../constants";
import ApiService from "../services/api.service";
import { AuthAction, ActionType } from "./auth.reducer";

export enum SettingsActionType {
  SET_SETTINGS_DATA = "SET_SETTINGS_DATA",
  RESET_SETTINGS_DATA = "RESET_SETTINGS_DATA",
  SET_SETTINGS_PRIVATE_API_KEY = "SET_SETTINGS_PRIVATE_API_KEY",
  SET_RESEND_SETTINGS_PRIVATE_API_KEY = "SET_RESEND_SETTINGS_PRIVATE_API_KEY",
  SET_DOMAINS_LIST = "SET_DOMAINS_LIST",
  SET_RESEND_DOMAINS_LIST = "SET_RESEND_DOMAINS_LIST",
  SET_EVENTS_COMPLETION = "SET_EVENTS_COMPLETION",
  TOGGLE_NAVBAR = "TOGGLE_NAVBAR",
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

interface setResendPrivateApiKeyData {
  type: SettingsActionType.SET_RESEND_SETTINGS_PRIVATE_API_KEY;
  payload: string;
}

interface setDomainsListData {
  type: SettingsActionType.SET_DOMAINS_LIST;
  payload: Array<any>;
}
interface setResendDomainsListData {
  type: SettingsActionType.SET_RESEND_DOMAINS_LIST;
  payload: Array<any>;
}

interface setEventsCompletion {
  type: SettingsActionType.SET_EVENTS_COMPLETION;
  payload: boolean;
}

interface IToggleNavbar {
  type: SettingsActionType.TOGGLE_NAVBAR;
  payload?: boolean;
}

export type SettingsAction =
  | setSettingsData
  | resetSettingData
  | setPrivateApiKeyData
  | setResendPrivateApiKeyData
  | setDomainsListData
  | setResendDomainsListData
  | setEventsCompletion
  | IToggleNavbar;

export interface SettingsData {
  friendsList?: string;
  channel?: any;
  events?: any;
  eventProvider?: any;
  eventsCompleted: boolean;
  domainName?: any;
  emailList?: string;
  defaultName?: string;
  defaultEmail?: string;
  privateApiKey?: string;
  domainsList?: any;
  phPrivateApiKey?: string;
  phProjectId?: string;
  phHostUrl?: string;
  phEmail?: string;
  phSms?: string;
  phOther?: string;
}

export interface SettingsState {
  settings: SettingsData;
  domainsList?: Array<any>;
  navbarOpened?: boolean;
}

const initialState = {
  settings: {
    channel: null,
    events: null,
    friendsList: "",
    eventProvider: null,
    eventsCompleted: false,
    domainName: null,
    emailList: "",
    defaultEmail: "",
    defaultName: "",
    privateApiKey: "",
    phPrivateApiKey: "",
    phProjectId: "",
    phHostUrl: "https://app.posthog.com",
    phEmail: "",
    phSms: "",
    phOther: "",
    domainsList: [],
  },
  domainsList: [],
  navbarOpened: false,
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

    case SettingsActionType.SET_EVENTS_COMPLETION:
      return {
        ...state,
        settings: { ...state.settings, eventsCompleted: action.payload },
      };

    case SettingsActionType.TOGGLE_NAVBAR:
      return {
        ...state,
        navbarOpened: action.payload ?? !state.navbarOpened,
      };

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

export const setEventsComplete = (payload: any): any => {
  console.log("setting eventsComplete");
  console.log(payload);
  return (dispatch: Dispatch<SettingsAction>) => {
    dispatch({
      type: SettingsActionType.SET_EVENTS_COMPLETION,
      payload: payload,
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

export const setResendSettingsPrivateApiKey = (payload: any): any => {
  return (dispatch: Dispatch<SettingsAction>) => {
    dispatch({
      type: SettingsActionType.SET_RESEND_SETTINGS_PRIVATE_API_KEY,
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
    } catch (err) {
      return {
        err,
      };
    }
  };
};

export const setResendDomainsList = (body: any): any => {
  return async (dispatch: Dispatch<SettingsAction>) => {
    try {
      const { data, status } = await ApiService.get({
        url: `${ApiConfig.resendDomains}/${body}`,
      });
      dispatch({
        type: SettingsActionType.SET_RESEND_DOMAINS_LIST,
        payload: data,
      });

      return {
        data,
        status,
      };
    } catch (err) {
      return {
        err,
      };
    }
  };
};

export const startPosthogImport = async () => {
  try {
    console.log("in phi");
    await ApiService.post({
      url: `${ApiConfig.syncPosthog}`,
      options: { fakeAPI: false },
    });
    console.log("in phi 2");
  } catch (err) {
    console.log("error in posthog imp");
    console.log(err);
    return {
      err,
    };
  }
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
          verified: data.verified,
          pushPlatforms: data.pushPlatforms,
          pk: data.pk,
        },
      });

      return {
        data,
        status,
      };
    } catch (err) {
      return {
        err,
      };
    }
  };
};

export const toggleNavbar = (isOpen?: boolean): any => {
  return (dispatch: Dispatch<SettingsAction>) => {
    dispatch({
      type: SettingsActionType.TOGGLE_NAVBAR,
      payload: isOpen,
    });
  };
};
