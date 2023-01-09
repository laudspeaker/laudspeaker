import { CircularProgress } from "@mui/material";
import React from "react";

export interface ButtonProps {
  id?: string;
  children: string | React.ReactNode;
  customClasses?: string;
  disabled?: boolean;
  disableElevation?: boolean;
  preventDefault?: boolean;
  fullWidth?: boolean;
  href?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  style?: object;
  loading?: boolean;
}

const GenericButton = (props: ButtonProps) => {
  const {
    id,
    children,
    customClasses,
    disabled,
    disableElevation,
    preventDefault,
    onClick,
    style,
    loading,
  } = props;

  return (
    <button
      id={id}
      type="button"
      className={`transition-[0.3s] inline-flex items-center rounded-md border-0 border-transparent text-white bg-cyan-600 px-6 py-3 text-base font-medium shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
        disabled ? "grayscale" : ""
      } ${customClasses ? customClasses : ""} `}
      onClick={(ev) => {
        if (disableElevation) {
          ev.stopPropagation();
        }
        if (preventDefault) {
          ev.preventDefault();
        }

        onClick(ev);
      }}
      disabled={disabled}
      style={style}
    >
      {loading && (
        <div className="flex items-center justify-center mr-[10px]">
          <CircularProgress size={20} />
        </div>
      )}
      {children}
    </button>
  );
};

export default GenericButton;
