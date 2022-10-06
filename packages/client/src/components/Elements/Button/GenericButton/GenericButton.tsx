import React from "react";
import { Button } from "@mui/material";

export interface ButtonProps {
  children: string | React.ReactNode;
  customClasses?: Object;
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  disabled?: boolean;
  disableElevation?: boolean;
  disableFocusRipple?: boolean;
  disableRippleEffect?: boolean;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
  size?: "small" | "medium" | "large";
  prefix?: React.ReactNode;
  variant?: "contained" | "outlined" | "text";
  sx?: object;
  onClick: (e: any) => void;
  style?: object;
}

const GenericButton = (props: ButtonProps) => {
  const {
    children,
    variant,
    customClasses,
    color,
    disabled,
    disableElevation,
    disableFocusRipple,
    disableRippleEffect,
    suffix,
    prefix,
    fullWidth,
    href,
    size,
    sx,
    onClick,
    style,
  } = props;
  return (
    <Button
      variant={variant}
      classes={customClasses}
      color={color}
      disabled={disabled}
      disableElevation={disableElevation}
      disableFocusRipple={disableFocusRipple}
      endIcon={suffix}
      startIcon={prefix}
      disableRipple={disableRippleEffect}
      fullWidth={fullWidth}
      href={href}
      size={size}
      onClick={onClick}
      sx={{ borderRadius: "8px", ...sx }}
      style={style}
    >
      {children}
    </Button>
  );
};

export default GenericButton;
