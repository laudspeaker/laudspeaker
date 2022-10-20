import React, { KeyboardEvent } from "react";
import {
  InputBase as MuiInput,
  InputLabel,
  FormHelperText,
} from "@mui/material";

export interface InputProps {
  id?: string;
  name: string;
  value: any;
  autoComplete?: string;
  autoFocus?: boolean;
  customClasses?: object;
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  disabled?: boolean;
  isError?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  inputRef?: React.RefObject<any>;
  label?: React.ReactNode;
  labelShrink?: boolean;
  placeholder?: string;
  isRequired?: boolean;
  size?: "medium" | "small";
  // variant?: 'filled' | 'outlined' | 'standard',
  sx?: object;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  multiline?: boolean;
  minRows?: number | string;
  inputProps?: object;
  endAdornment?: React.ReactNode;
  onBlur?: () => void;
  ref?: any;
}

const Input = (props: InputProps) => {
  const {
    id,
    autoComplete,
    autoFocus,
    customClasses,
    color,
    disabled,
    isError,
    fullWidth,
    inputRef,
    label,
    name,
    placeholder,
    isRequired,
    size,
    sx,
    onChange,
    onKeyDown,
    type,
    labelShrink,
    helperText,
    multiline,
    minRows,
    inputProps,
    value,
    endAdornment,
    onBlur,
  } = props;
  return (
    <>
      {label && (
        <InputLabel shrink={labelShrink} htmlFor={id}>
          {label}
        </InputLabel>
      )}
      <MuiInput
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        classes={customClasses}
        color={color}
        disabled={disabled}
        error={isError}
        fullWidth={fullWidth}
        id={id}
        inputRef={inputRef}
        name={name}
        placeholder={placeholder}
        required={isRequired}
        // variant={variant}
        size={size}
        type={type}
        sx={sx}
        onChange={onChange}
        onKeyDown={onKeyDown}
        multiline={multiline}
        minRows={minRows}
        inputProps={inputProps}
        value={value}
        endAdornment={endAdornment}
        onBlur={onBlur}
      />
      {helperText && (
        <FormHelperText error={isError} required={isRequired}>
          {helperText}
        </FormHelperText>
      )}
    </>
  );
};

export default Input;
