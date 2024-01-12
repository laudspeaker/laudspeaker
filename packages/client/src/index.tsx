import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";
import RouteComponent from "./Routes";
import App from "./App";
import { PersistGate } from "redux-persist/integration/react";
import persistor from "./Store";
import { Helmet } from "react-helmet";
import { store } from "store/store";
import * as Sentry from "@sentry/react";
import config, {
  SENTRY_DSN_URL_FRONTEND_KEY,
  SENTRY_ENVIRONMENT_TAG_KEY,
  SENTRY_RELEASE_KEY,
} from "config";

Sentry.init({
  dsn: config.get(SENTRY_DSN_URL_FRONTEND_KEY),
  release: config.get(SENTRY_RELEASE_KEY),
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/laudspeaker\.com\/api/,
      ],
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

if (config.get(SENTRY_ENVIRONMENT_TAG_KEY)) {
  Sentry.setTag(
    "laudspeaker_environment",
    config.get(SENTRY_ENVIRONMENT_TAG_KEY)
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    {/* <PersistGate loading={null} persistor={persistor.persistor}> */}
    <App>
      <RouteComponent />
    </App>
    {/* </PersistGate> */}
  </Provider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export default root;
