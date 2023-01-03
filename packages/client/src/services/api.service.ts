import axios from "axios";
import { ApiConfig, AppConfig } from "../constants";
import TokenService from "./token.service";

export interface ApiServiceArgs<T> {
  url: string;
  options?: Record<string, T> & { fakeAPI?: boolean; jsonServer?: boolean };
}

const instance = axios.create({
  baseURL: AppConfig.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
instance.interceptors.request.use(
  (config) => {
    const token = TokenService.getLocalAccessToken();
    if (token && config?.headers) {
      config.headers.Authorization = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    if (originalConfig.url === ApiConfig.login) {
    }
    if (originalConfig.url !== ApiConfig.login && err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;
        try {
          const rs = await instance.post(ApiConfig.refreshtoken, {
            refreshToken: TokenService.getLocalRefreshToken(),
          });
          const { accessToken } = rs.data;
          TokenService.updateLocalAccessToken(accessToken);
          return await instance(originalConfig);
        } catch (_error) {
          return Promise.reject(_error);
        }
      }
    }
    return Promise.reject(err);
  }
);

const ApiService = {
  async get<T>({ url, options }: ApiServiceArgs<T>) {
    const { fakeAPI = false, jsonServer = false, ...rest } = options || {};
    return instance.get(url, {
      ...(fakeAPI && { baseURL: AppConfig.FAKE_SERVER_URL }),
      ...(jsonServer && { baseURL: AppConfig.JSON_SERVER_URL }),
      ...rest,
    });
  },
  async post<T>({ url, options }: ApiServiceArgs<T>) {
    const { fakeAPI = false, jsonServer = false, ...rest } = options || {};
    return instance.post(url, {
      ...(fakeAPI && { baseURL: AppConfig.FAKE_SERVER_URL }),
      ...(jsonServer && { baseURL: AppConfig.JSON_SERVER_URL }),
      ...rest,
    });
  },
  async put<T>({ url, options }: ApiServiceArgs<T>) {
    const { fakeAPI = false, ...rest } = options || {};
    return instance.put(url, {
      ...(fakeAPI && { baseURL: AppConfig.FAKE_SERVER_URL }),
      ...rest,
    });
  },
  async delete<T>({ url, options }: ApiServiceArgs<T>) {
    const { fakeAPI = false, ...rest } = options || {};
    return instance.delete(url, {
      ...(fakeAPI && { baseURL: AppConfig.FAKE_SERVER_URL }),
      ...rest,
    });
  },
  async patch<T>({ url, options }: ApiServiceArgs<T>) {
    const { fakeAPI = false, ...rest } = options || {};
    return instance.patch(url, {
      ...(fakeAPI && { baseURL: AppConfig.FAKE_SERVER_URL }),
      ...rest,
    });
  },
};
export default ApiService;
