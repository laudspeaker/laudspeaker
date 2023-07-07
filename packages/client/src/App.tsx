// @ts-nocheck
import { useContext, useEffect, useMemo, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "reactflow/dist/style.css";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import {
  createTheme,
  CssBaseline,
  PaletteMode,
  ThemeProvider,
} from "@mui/material";
import { ColorContext } from "./ColorContext";
import { darkTheme } from "./themes/dark";
import { lightTheme } from "./themes/light";
import "./Global.css";
import posthog from "posthog-js";
import { AppConfig } from "./constants";
import { ToastContainer } from "react-toastify";
import {
  ThemeProvider as MTThemeProvider,
  TooltipStylesType,
} from "@material-tailwind/react";

// split io
import { SplitSdk, SplitFactory } from "@splitsoftware/splitio-react";

// Create the Split factory object with your custom settings, using the re-exported function.
const factory: SplitIO.ISDK = SplitSdk({
  core: {
    authorizationKey: "pn5gq12e27h5ejbcjq0l3i8ah4blqauh6fhe",
    key: "CUSTOMER_ID",
  },
});

interface IApp {
  children: React.ReactNode;
}
const App = ({ children }: IApp) => {
  const [mode, setMode] = useState<PaletteMode>("light");
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === "light" ? "dark" : "light"
        );
      },
    }),
    []
  );

  const theme = useMemo(
    () => createTheme(mode === "light" ? lightTheme : darkTheme),
    [mode]
  );

  const MTTheme: { tooltip: TooltipStylesType } = {
    tooltip: {
      styles: {
        base: {
          bg: "bg-white",
          color: "text-black",
        },
      },
    },
  };
  if (
    AppConfig.POSTHOG_KEY !== "" &&
    AppConfig.POSTHOG_KEY !== "[YOUR_VALUE]"
  ) {
    posthog.init(AppConfig.POSTHOG_KEY ? AppConfig.POSTHOG_KEY : "", {
      api_host: AppConfig.POSTHOG_HOST
        ? AppConfig.POSTHOG_HOST
        : "https://app.posthog.com",
    });
  }

  return (
    <SplitFactory factory={factory}>
      <ColorContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          {/* @ts-ignore */}
          <MTThemeProvider value={MTTheme}>
            <CssBaseline enableColorScheme />
            <ToastContainer
              className={"z-[2147483647]"}
              position="bottom-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <GoogleOAuthProvider clientId="31818866399-n6jktkbmj0o0tt7gbi8i8nosu61nakda.apps.googleusercontent.com">
              {children}
            </GoogleOAuthProvider>
          </MTThemeProvider>
        </ThemeProvider>
      </ColorContext.Provider>
    </SplitFactory>
  );
};

export default App;
