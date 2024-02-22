import React, { ChangeEvent, FC, FocusEvent, RefObject } from "react";

interface TextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  onFocus?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  isRequired?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  maxLength?: number;
}

const Textarea: FC<TextareaProps> = ({
  value,
  onChange,
  className = "",
  textareaRef,
  onFocus,
  isRequired,
  placeholder,
  name,
  id,
  maxLength,
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      className={`focus:ring-cyan-600 rounded-md ${className}`}
      ref={textareaRef}
      onFocus={onFocus}
      required={isRequired}
      placeholder={placeholder}
      name={name}
      id={id}
      maxLength={maxLength}
    />
  );
};

export default Textarea;
