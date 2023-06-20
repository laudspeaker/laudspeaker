import React, { FC, MouseEvent, ReactNode } from "react";

export enum ButtonType {
  PRIMARY,
  SECONDARY,
  LINK,
}

export interface ButtonProps {
  type: ButtonType;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

const Button: FC<ButtonProps> = ({ type, className, children, ...props }) => {
  return (
    <button
      className={`disabled:!border-[#E5E7EB] disabled:!text-[#9CA3AF] font-roboto font-normal text-[14px] leading-[22px] ${
        type === ButtonType.PRIMARY
          ? "bg-[#6366F1] border-[1px] border-[#6366F1] rounded-[4px] px-[15px] py-[4px] text-white flex items-center justify-center hover:border-[#818CF8] hover:bg-[#818CF8] focus:border-[#4338CA] focus:bg-[#4338CA] disabled:!bg-[#F3F4F6]"
          : type === ButtonType.SECONDARY
          ? "bg-white border-[1px] border-[#E5E7EB] rounded-[4px] px-[15px] py-[4px] text-[#111827] flex items-center justify-center hover:border-[#818CF8] hover:text-[#818CF8] focus:border-[#4338CA] focus:text-[#4338CA] disabled:!bg-[#F3F4F6]"
          : "text-[#111827] underline hover:text-[#818CF8] focus:text-[#4338CA]"
      } ${className ? className : ""}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
