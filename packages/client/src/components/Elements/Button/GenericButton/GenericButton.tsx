import React from "react";

export interface ButtonProps {
  children: string | React.ReactNode;
  customClasses?: string;
  disabled?: boolean;
  disableElevation?: boolean;
  preventDefault?: boolean;
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
    preventDefault,
    onClick,
    style,
  } = props;
  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-md border-0 border-transparent text-white bg-cyan-600 px-6 py-3 text-base font-medium shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
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
      {children}
    </button>
  );
};

export default GenericButton;
