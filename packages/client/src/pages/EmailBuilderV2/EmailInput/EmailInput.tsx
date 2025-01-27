import { Input } from "components/Elements";
import React, { ChangeEvent, FocusEvent, FC } from "react";

interface EmailInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
  name: string;
  id: string;
  placeholder: string;
  isRequired?: boolean;
  fullWidth?: boolean;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  inputClassNames?: string;
}

const EmailInput: FC<EmailInputProps> = ({
  value,
  onChange,
  setValue,
  placeholder,
  name,
  id,
  fullWidth,
  inputClassNames = "",
  onFocus,
}) => {
  return (
    <div className="w-full m-0">
      <Input
        value={value}
        placeholder={placeholder}
        name={name}
        id={id}
        fullWidth={fullWidth}
        className={`w-full ${inputClassNames}`}
        onChange={onChange}
        onFocus={onFocus}
      />
    </div>
  );
};

export default EmailInput;
