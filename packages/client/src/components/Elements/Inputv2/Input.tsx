import React, { FC, InputHTMLAttributes } from "react";
import clearInputIconImage from "./svg/clear-input-icon.svg";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  showClearButton?: boolean;
  className?: string;
}

const Input: FC<InputProps> = ({
  value,
  onChange,
  className,
  showClearButton,
  ...props
}) => {
  return (
    <div className="w-fit relative">
      <input
        className={`border-[1px] border-[#E5E7EB] rounded-[4px] px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none ${
          showClearButton ? "!pr-[30px]" : ""
        } ${className ? className : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {showClearButton && (
        <button
          className="absolute top-1/2 -translate-y-1/2 right-[12px]"
          onClick={() => onChange("")}
        >
          <img src={clearInputIconImage} />
        </button>
      )}
    </div>
  );
};

export default Input;
