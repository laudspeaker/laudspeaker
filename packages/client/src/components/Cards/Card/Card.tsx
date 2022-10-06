import React from "react";
import { Card as MuiCard } from "@mui/material";

export interface Cardprops {
  children?: React.ReactNode;
  raisedStyle?: boolean;
  sx?: object;
  overideClasses?: object;
  squareCorner?: boolean;
  variant?: "elevation" | "outlined";
}

const Card = (props: Cardprops) => {
  const { children, raisedStyle, sx, overideClasses, squareCorner, variant } =
    props;

  return (
    <MuiCard
      raised={raisedStyle}
      classes={overideClasses}
      sx={sx}
      square={squareCorner}
      variant={variant}
    >
      {children}
    </MuiCard>
  );
};

export default Card;
