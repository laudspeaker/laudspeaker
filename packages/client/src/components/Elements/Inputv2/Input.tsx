import React, { FC, InputHTMLAttributes } from "react";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const Input: FC<InputProps> = ({ value, onChange, className, ...props }) => {
  return (
    <input
      className={`border-[1px] border-[#E5E7EB] rounded-[4px] px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none ${
        className ? className : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
};

export default Input;
