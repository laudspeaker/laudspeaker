import React from "react";
import { Button } from "@mui/material";

export interface ButtonProps {
  children: string | React.ReactNode;
  customClasses?: string;
  disabled?: boolean;
  disableElevation?: boolean;
  fullWidth?: boolean;
  href?: string;
  onClick: (e: any) => void;
  style?: object;
}

const GenericButton = (props: ButtonProps) => {
  const {
    children,
    customClasses,
    disabled,
    disableElevation,
    onClick,
    style,
  } = props;
  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        customClasses ? customClasses : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default GenericButton;
