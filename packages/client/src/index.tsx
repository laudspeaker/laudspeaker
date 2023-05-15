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

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    {/* <PersistGate loading={null} persistor={persistor.persistor}> */}
    <Helmet>
      <script>
        {`!function(e,t,n,s,u,a)
          {e.twq ||
            ((s = e.twq =
              function () {
                s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
              }),
            (s.version = "1.1"),
            (s.queue = []),
            (u = t.createElement(n)),
            (u.async = !0),
            (u.src = "https://static.ads-twitter.com/uwt.js"),
            (a = t.getElementsByTagName(n)[0]),
            a.parentNode.insertBefore(u, a))}
          (window,document,'script'); twq('config','ociqx');`}
      </script>
    </Helmet>
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
