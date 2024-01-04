import { Dispatch } from "redux";
import { ApiConfig } from "../constants";
import ApiService from "../services/api.service";
import tokenService from "../services/token.service";
import posthog from "posthog-js";
import { toast } from "react-toastify";
import { ConnectedPushFirebasePlatforms } from "pages/PushSettings/PushSettings";
import { UserPK } from "types/Account";

export enum ActionType {
  AUTH_USER_PENDING = "AUTH_USER_PENDING",
  LOGIN_USER_SUCCESS = "LOGIN_USER_SUCCESS",
  LOGIN_USER_FAIL = "LOGIN_USER_FAIL",
  SIGNUP_USER_SUCCESS = "SIGNUP_USER_SUCCESS",
  SIGNUP_USER_FAIL = "SIGNUP_USER_FAIL",
  UPDATE_USER_INFO = "UPDATE_USER_INFO",
  USER_PERMISSIONS = "USER_PERMISSIONS",
}

export interface IUserData {
  email: string;
  firstName: string;
  lastName: string;
  uId: string;
  onboarded: boolean;
  verified: boolean;
  expectedOnboarding: string[];
  pushPlatforms: ConnectedPushFirebasePlatforms;
  pk?: UserPK;
}

export interface ILoginForm {
  email: string;
  password: string;
}

export interface ISignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  fromInviteId?: string;
}

interface ActionPending {
  type: ActionType.AUTH_USER_PENDING;
}

interface ActionLoginSuccess {
  type: ActionType.LOGIN_USER_SUCCESS;
  payload: IUserData;
}

interface ActionLoginFail {
  type: ActionType.LOGIN_USER_FAIL;
  payload: string;
}

interface ActionSignupSuccess {
  type: ActionType.SIGNUP_USER_SUCCESS;
  payload: IUserData;
}

interface ActionSignupFail {
  type: ActionType.SIGNUP_USER_FAIL;
  payload: string;
}

interface ActionUpdateUserInfo {
  type: ActionType.UPDATE_USER_INFO;
  payload: IUserData;
}

interface UserPermissions {
  type: ActionType.USER_PERMISSIONS;
  payload: any;
}

export type AuthAction =
  | ActionPending
  | ActionLoginSuccess
  | ActionLoginFail
  | ActionSignupSuccess
  | ActionSignupFail
  | UserPermissions
  | ActionUpdateUserInfo;

export interface AuthState {
  userData: Partial<IUserData>;
  loading: boolean;
  error: string | null;
  userPermissions?: string[];
}

const initialState = {
  userData: {},
  loading: false,
  error: null,
};

const authReducer = (
  state: AuthState = initialState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case ActionType.AUTH_USER_PENDING:
      return {
        ...state,
        loading: true,
        userData: {},
        error: null,
      };
    case ActionType.LOGIN_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        userData: action.payload,
        error: null,
      };
    case ActionType.LOGIN_USER_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        userData: {},
      };
    case ActionType.SIGNUP_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        userData: action.payload,
        error: null,
      };
    case ActionType.SIGNUP_USER_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        userData: {},
      };
    case ActionType.USER_PERMISSIONS:
      return {
        ...state,
        userPermissions: action.payload,
      };
    case ActionType.UPDATE_USER_INFO:
      return {
        ...state,
        userData: action.payload,
      };
    default:
      return state;
  }
};

export default authReducer;

export const loginUser = (body: ILoginForm): any => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch({
      type: ActionType.AUTH_USER_PENDING,
    });

    try {
      const { data, status } = await ApiService.post<any>({
        url: `${ApiConfig.login}`,
        options: {
          ...body,
        },
      });
      if (data?.access_token) {
        tokenService.setUser({
          ...data,
          accessToken: data.access_token,
          email: body.email,
        });
      }
      dispatch({
        type: ActionType.LOGIN_USER_SUCCESS,
        payload: {
          firstName: data.firstName,
          lastName: data.lastName,
          uId: data.id,
          onboarded: data.onboarded,
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
      toast.error("Email or password is incorrect!", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });

      if (err instanceof Error) {
        posthog.capture("authError", {
          authError: err.message,
        });
        dispatch({
          type: ActionType.LOGIN_USER_FAIL,
          payload: err.message,
        });
      }

      return {
        err,
      };
    }
  };
};

export const getUserPermissions = (): any => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch({
      type: ActionType.USER_PERMISSIONS,
      payload: [
        "home",
        "journeys",
        "campaigns",
        "segments",
        "users",
        "integrations",
        "analysis",
        "settings",
        "event-tracker",
      ],
    });
  };
};

export const signUpUser = (body: ISignUpForm): any => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch({
      type: ActionType.AUTH_USER_PENDING,
    });

    try {
      const { confirmPassword, ...rest } = body;
      const { data } = await ApiService.post<any>({
        url: `${ApiConfig.signup}`,
        options: {
          ...rest,
        },
      });
      if (data?.access_token) {
        tokenService.updateLocalAccessToken(data?.access_token);
      }
      dispatch({
        type: ActionType.SIGNUP_USER_SUCCESS,
        payload: {
          email: data.email,
          uId: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          onboarded: data.onboarded,
          expectedOnboarding: [],
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
      if (err instanceof Error)
        dispatch({
          type: ActionType.SIGNUP_USER_FAIL,
          payload: err.message,
        });
      return { err };
    }
  };
};
