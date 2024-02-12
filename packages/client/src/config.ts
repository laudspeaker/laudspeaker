/* Config keys */
// Make sure any keys changed here are adjusted in the setup_config.sh script
export const API_BASE_URL_KEY = "api_base_url";
export const POSTHOG_KEY_KEY = "posthog_key";
export const POSTHOG_HOST_KEY = "posthog_host";
export const WS_BASE_URL_KEY = "ws_base_url";
export const JOURNEY_ONBOARDING_KEY = "journey_onboarding";
export const ONBOARDING_API_KEY_KEY = "onboarding_api_key";
export const SENTRY_DSN_URL_FRONTEND_KEY = "sentry_dsn_url_frontend";
export const SENTRY_ENVIRONMENT_TAG_KEY = "sentry_environment_tag";
export const SENTRY_RELEASE_KEY = "sentry_release"; //not configurable in setup_config.sh because don't see reason to configure
type ConfigKey =
  | typeof API_BASE_URL_KEY
  | typeof POSTHOG_KEY_KEY
  | typeof POSTHOG_HOST_KEY
  | typeof WS_BASE_URL_KEY
  | typeof JOURNEY_ONBOARDING_KEY
  | typeof ONBOARDING_API_KEY_KEY
  | typeof SENTRY_ENVIRONMENT_TAG_KEY
  | typeof SENTRY_DSN_URL_FRONTEND_KEY
  | typeof SENTRY_RELEASE_KEY;

class Config {
  appConfig: { [key: string]: any };

  defaultConfig: { [key: string]: any } = {
    [POSTHOG_KEY_KEY]: "",
    [API_BASE_URL_KEY]: "https://api.laudspeaker.com",
    [SENTRY_DSN_URL_FRONTEND_KEY]:
      process.env.REACT_APP_SENTRY_DSN_URL_FRONTEND,
    [SENTRY_RELEASE_KEY]: process.env.REACT_APP_SENTRY_RELEASE,
  };

  constructor() {
    this.appConfig = {};
    // Set url values passed in at runtime
    if (process.env.NODE_ENV === "development") {
      // When in development mode, comes from ENV_VAR
      const apiUrl = process.env.REACT_APP_API_BASE_URL;
      if (apiUrl) {
        this.appConfig[API_BASE_URL_KEY] = apiUrl;
      } else {
        throw Error("Environment variable missing: REACT_APP_API_BASE_URL");
      }

      Object.keys(process.env).forEach((envVar) => {
        if (envVar.toLowerCase().startsWith("react_app_")) {
          const key = envVar.toLowerCase().replace("react_app_", "");
          const val = process.env[envVar];
          this.appConfig[key] = val;
        }
      });
    } else {
      // When in production, comes from config.js file at runtime
      const windowConfig = (window as any as { appConfig: any }).appConfig;
      if (windowConfig) {
        this.appConfig = {
          ...windowConfig,
        };
      }
    }
  }

  get(configKey: ConfigKey): any {
    let val = this.appConfig[configKey];
    if (val === undefined) {
      val = this.defaultConfig[configKey];
    }
    return val;
  }

  set(configKey: ConfigKey, configVal: any): void {
    /* Updates global app config object */
    this.appConfig[configKey] = configVal;
  }
}

const config = new Config();
export default config;
