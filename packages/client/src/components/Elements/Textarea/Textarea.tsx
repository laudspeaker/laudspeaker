import React, { ChangeEvent, FC, FocusEvent, RefObject } from "react";

interface TextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  onFocus?: (e: FocusEvent<HTMLTextAreaElement>) => void;
}

const Textarea: FC<TextareaProps> = ({
  value,
  onChange,
  className = "",
  textareaRef,
  onFocus,
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      className={`focus:ring-cyan-600 rounded-md ${className}`}
      ref={textareaRef}
      onFocus={onFocus}
    />
  );
};

export default Textarea;
