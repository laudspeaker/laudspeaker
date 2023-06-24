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
      className={`transition-[0.3s] relative inline-flex items-center inline-flex items-center border border-transparent bg-[#6366F1] px-6 py-3 text-base font-medium text-white shadow-sm hover:border-[#818CF8] hover:bg-[#818CF8] focus:border-[#4338CA] focus:bg-[#4338CA] disabled:!bg-[#F3F4F6] rounded-md ${
        disabled || loading ? "grayscale" : ""
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
      disabled={disabled || loading}
      style={style}
    >
      {loading && (
        <div className="absolute w-full bg-transparent h-full backdrop-blur-md rounded-md left-0 top-0 flex items-center justify-center mr-[10px]">
          <CircularProgress size={20} />
        </div>
      )}
      {children}
    </button>
  );
};

export default GenericButton;
