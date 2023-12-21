/* Config keys */
// Make sure any keys changed here are adjusted in the setup_config.sh script
export const API_BASE_URL_KEY = "api_base_url";
type ConfigKey = typeof API_BASE_URL_KEY;

class Config {
  appConfig: { [key: string]: any };

  defaultConfig: { [key: string]: any } = {};

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
