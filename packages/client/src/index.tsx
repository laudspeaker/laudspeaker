import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";
import RouteComponent from "./Routes";
import App from "./App";
import { PersistGate } from "redux-persist/integration/react";
import persistor from "./Store";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Provider store={persistor.store}>
    <PersistGate loading={null} persistor={persistor.persistor}>
      <App>
        <RouteComponent />
      </App>
    </PersistGate>
  </Provider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export default root;
