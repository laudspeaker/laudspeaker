import React from "react";
import { Radio } from "@mui/material";

export interface RadioButtonProps<T> {
  name: string;
  id: string;
  checked: boolean;
  customClasses?: Object;
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  customCheckedIcon?: React.ReactNode;
  disabled?: boolean;
  disableRippleEffect?: boolean;
  inputRequired?: boolean;
  customUncheckedIcon?: React.ReactNode;
  size?: "small" | "medium";
  // indeterminateIcon?: React.ReactNode,
  cssOverideClass?: object;
  // variant?: 'contained' | 'outlined' | 'text',
  inputProps?: object;
  inputRef?: React.RefObject<HTMLInputElement>;
  value?: T;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton = <T,>(props: RadioButtonProps<T>) => {
  const {
    checked,
    customClasses,
    customCheckedIcon,
    color,
    disabled,
    disableRippleEffect,
    customUncheckedIcon,
    id,
    inputProps,
    inputRef,
    name,
    inputRequired,
    size,
    cssOverideClass,
    value,
    onChange,
  } = props;
  return (
    <Radio
      id={id}
      name={name}
      checked={checked}
      classes={customClasses}
      checkedIcon={customCheckedIcon}
      color={color}
      disabled={disabled}
      disableRipple={disableRippleEffect}
      icon={customUncheckedIcon}
      inputProps={inputProps}
      inputRef={inputRef}
      required={inputRequired}
      size={size}
      sx={cssOverideClass}
      value={value}
      onChange={onChange}
    />
  );
};

export default RadioButton;
