import React, { KeyboardEvent } from "react";

export interface InputProps {
  id?: string;
  name: string;
  value: any;
  autoComplete?: string;
  autoFocus?: boolean;
  customClasses?: object;
  disabled?: boolean;
  isError?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  inputRef?: React.RefObject<any>;
  label?: React.ReactNode;
  placeholder?: string;
  isRequired?: boolean;
  style?: object;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputProps?: object;
  className?: string;
  labelClass?: string;
  onBlur?: () => void;
  ref?: any;
}

const Input = (props: InputProps) => {
  const {
    id,
    autoComplete,
    autoFocus,
    customClasses,
    disabled,
    isError,
    fullWidth,
    inputRef,
    label,
    name,
    placeholder,
    isRequired,
    onChange,
    onKeyDown,
    type,
    helperText,
    inputProps,
    labelClass,
    className,
    value,
    onBlur,
    style,
  } = props;
  return (
    <>
      <div>
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <div className="mt-1">
          <input
            required={isRequired}
            type={type}
            name={name}
            id={id}
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            className={`block w-full min-h-[30px] p-[5px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              className ? className : ""
            }`}
            placeholder={placeholder}
            style={style}
          />
        </div>
      </div>
      {/* {label && (
        <InputLabel className={labelClass} shrink={labelShrink} htmlFor={id}>
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
        className={className}
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
      )} */}
    </>
  );
};

export default Input;
