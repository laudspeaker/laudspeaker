import React, {
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  LegacyRef,
  RefObject,
} from "react";

interface InputProps {
  id?: string;
  name: string;
  value?: string | number | readonly string[];
  autoComplete?: string;
  autoFocus?: boolean;
  customClasses?: object;
  disabled?: boolean;
  isError?: boolean;
  errorText?: string;
  fullWidth?: boolean;
  helperText?: string;
  inputRef?: RefObject<HTMLInputElement> | LegacyRef<HTMLInputElement>;
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
  onBlur?: FocusEventHandler;
  ref?: LegacyRef<HTMLInputElement>;
  endText?: string;
  wrapperClasses?: string;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

const Input = (props: InputProps) => {
  const {
    id,
    autoComplete,
    autoFocus,
    customClasses,
    disabled,
    isError,
    errorText,
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
    endText,
    wrapperClasses,
    onFocus,
    ...otherProps
  } = props;

  return (
    <div className={`w-full ${wrapperClasses || ""}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          autoFocus={autoFocus}
          required={isRequired}
          type={type || "text"}
          name={name}
          id={id}
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            className ? className : ""
          } ${
            isError
              ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
              : "border-gray-300 focus:border-[#818CF8] focus:ring-[#818CF8]"
          }`}
          placeholder={placeholder}
          style={style}
          {...otherProps}
        />
        {endText && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm" id="price-currency">
              {endText}
            </span>
          </div>
        )}
      </div>
      {isError && (
        <>
          <p className="mt-2 text-sm text-red-600">{errorText}</p>
        </>
      )}
    </div>
  );
};

export default Input;
