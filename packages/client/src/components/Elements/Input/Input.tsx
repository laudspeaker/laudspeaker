import React, { KeyboardEvent } from "react";

export interface InputProps {
  id?: string;
  name: string;
  value?: any;
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
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
      <div className="col-span-6">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          required={isRequired}
          type={type || "text"}
          name={name}
          id={id}
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:!border-cyan-500 focus:!ring-cyan-500 sm:text-sm ${
            className ? className : ""
          }`}
          placeholder={placeholder}
          style={style}
        />
      </div>
    </>
  );
};

export default Input;
