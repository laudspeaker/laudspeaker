import { IconButton, useTheme } from "@mui/material";
import DarkIcon from "@mui/icons-material/Brightness4";
import LightIcon from "@mui/icons-material/Brightness7";
import React from "react";

import { ColorContext } from "../../ColorContext";

export const SwitchModeButton = () => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorContext);

  return (
    <div className="flex w-full items-center justify-center">
      {theme.palette.mode} mode
      <IconButton
        sx={{ ml: 1 }}
        onClick={colorMode.toggleColorMode}
        color="inherit"
      >
        {theme.palette.mode === "dark" ? <LightIcon /> : <DarkIcon />}
      </IconButton>
    </div>
  );
};
