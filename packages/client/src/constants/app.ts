import config, { API_BASE_URL_KEY } from "config";

export default {
  APP_VERSION: process.env.REACT_APP_APP_VESION,
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || config.get(API_BASE_URL_KEY),
  FAKE_SERVER_URL: process.env.REACT_APP_FAKE_SERVER_URL,
  JSON_SERVER_URL: process.env.REACT_APP_JSON_SERVER_URL,
  POSTHOG_KEY: process.env.REACT_APP_POSTHOG_KEY,
  POSTHOG_HOST: process.env.REACT_APP_POSTHOG_HOST,
  WS_BASE_URL: process.env.REACT_APP_WS_BASE_URL,
  JOURNEY_ONBOARDING: process.env.REACT_APP_JOURNEY_ONBOARDING,
  ONBOARDING_API_KEY: process.env.REACT_APP_ONBOARDING_API_KEY,
  storageKeys: {
    USER_DATA: "userData",
  },
};
