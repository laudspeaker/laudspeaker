import { ThemeOptions } from "@mui/material";

export const lightTheme: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#000",
    },
    background: {
      paper: "#FFFFFF",
    },
    text: {
      primary: "#000",
      secondary: "#707070",
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
          borderRadius: "8px",
          position: "relative",
          backgroundColor: "#EFF0F2",
          fontSize: "20px",
          padding: "18px 29px",
        },
        inputSizeSmall: {
          padding: "18px 13px",
        },
        // error: {
        //   border: '1px solid red'
        // }
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          position: "relative",
          fontWeight: "500",
          fontSize: "20px",
          color: "#4D5959",
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          width: "100%",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: "500",
          fontSize: "26px",
          borderRadius: "8px",
          "&:hover": {
            backgroundColor: "#E5E5E5",
          },
        },
        sizeMedium: {
          fontWeight: "400",
          fontSize: "14px",
          color: "#FFFFFF",
          borderRadius: "24px",
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          height: "60px",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h2: {
          fontWeight: "600",
          fontSize: "48px",
          color: "#043133",
        },
        h3: {
          fontWeight: "600",
          fontSize: "25px",
          color: "#28282E",
        },
        h4: {
          fontWeight: "500",
          fontSize: "26px",
          color: "#043133",
        },
        body1: {
          fontWeight: "400",
          fontSize: "18px",
          color: "#4D5959",
        },
        body2: {
          fontWeight: "600",
          fontSize: "16px",
          color: "#28282E",
        },
        subtitle1: {
          fontWeight: "400",
          fontSize: "14px",
          color: "#707070",
        },
        subtitle2: {
          fontWeight: "500",
          fontSize: "16px",
          color: "#28282E",
          fontFamily: "Inter",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "24px",
          // padding: "20px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation: {
          boxShadow: "0px 8px 30px -15px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        standard: {
          backgroundColor: "#FFFFFF",
          boxShadow: "0px 8px 16px -6px rgba(0, 0, 0, 0.1)",
          borderRadius: "33px",
          fontWeight: "400",
          fontSize: "16px",
          color: "#28282E",
          padding: "13px 15px",
        },
        icon: {
          marginRight: "5px",
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          borderBottom: "none",
          "&:hover": {
            ":not(.Mui-disabled):before": {
              borderBottom: "none",
            },
          },
        },
        root: {
          "::after": {
            borderBottom: "none",
          },
          "::before": {
            borderBottom: "none",
          },
          marginTop: "0px !important",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeSmall: {
          height: "auto",
          padding: "0",
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          fontSize: "14px",
          fontWeight: "600",
          color: "#000000",
          fontFamily: "Inter",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          height: "35px",
          fontSize: "14px",
          fontWeight: "400",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: "0px 6px 40px -19px rgba(0, 0, 0, 0.25)",
          borderRadius: "10px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "#D1FAE5",
          borderRadius: "10px",
          fontSize: "12px",
          color: "#065F46",
          height: "20px",
          fontWeight: 500,
          padding: "2px 10px",
        },
        label: {
          padding: 0,
        },
      },
    },
    MuiCircularProgress: { styleOverrides: { circle: { color: "cyan" } } },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
};
