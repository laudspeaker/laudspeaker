import { ThemeOptions } from "@mui/material";

export const darkTheme: ThemeOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: "#FFF",
    },
    background: {
      paper: "#FFF",
    },
    text: {
      primary: "#FFF",
    },
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          "&:-webkit-autofill": {
            "-webkit-box-shadow": "0 0 0 100px transparent inset !important",
            "-webkit-text-fill-color": "#fff",
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          height: "50px",
        },
      },
    },
  },
};
