import React from "react";
import { Checkbox as MuiCheckbox } from "@mui/material";

export interface CheckBoxProps<T> {
  checked: boolean;
  id: string;
  value?: T;
  customClasses?: Object;
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  customCheckedIcon?: React.ReactNode;
  disabled?: boolean;
  defaultChecked?: boolean;
  disableRippleEffect?: boolean;
  customUncheckedIcon?: React.ReactNode;
  indeterminate?: boolean;
  size?: "small" | "medium";
  indeterminateIcon?: React.ReactNode;
  cssOverideClass?: object;
  inputProps?: object;
  inputRef?: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckBox = <T,>(props: CheckBoxProps<T>) => {
  const {
    checked,
    id,
    customClasses,
    color,
    customCheckedIcon,
    disabled,
    defaultChecked,
    disableRippleEffect,
    customUncheckedIcon,
    size,
    inputRef,
    onChange,
    inputProps,
    cssOverideClass,
    indeterminate,
    indeterminateIcon,
  } = props;
  return (
    <MuiCheckbox
      checked={checked}
      id={id}
      classes={customClasses}
      color={color}
      checkedIcon={customCheckedIcon}
      disabled={disabled}
      defaultChecked={defaultChecked}
      disableRipple={disableRippleEffect}
      icon={customUncheckedIcon}
      size={size}
      inputRef={inputRef}
      onChange={onChange}
      inputProps={inputProps}
      sx={cssOverideClass}
      indeterminate={indeterminate}
      indeterminateIcon={indeterminateIcon}
    />
  );
};

export default CheckBox;
