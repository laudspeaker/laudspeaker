import React, { FC, MouseEvent, ReactNode } from "react";

export enum ButtonType {
  PRIMARY,
  SECONDARY,
  LINK,
  DANGEROUS,
}

export interface ButtonProps {
  type: ButtonType;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  id?: string;
}

const specificTypeClassNameMap: Record<ButtonType, string> = {
  [ButtonType.PRIMARY]:
    "bg-[#6366F1] border-[1px] border-[#6366F1] rounded-[4px] px-[15px] py-[4px] text-white flex items-center justify-center hover:border-[#818CF8] hover:bg-[#818CF8] focus:border-[#4338CA] focus:bg-[#4338CA] disabled:!bg-[#F3F4F6]",
  [ButtonType.SECONDARY]:
    "bg-white border-[1px] border-[#E5E7EB] rounded-[4px] px-[15px] py-[4px] text-[#111827] flex items-center justify-center hover:border-[#818CF8] hover:text-[#818CF8] focus:border-[#4338CA] focus:text-[#4338CA] disabled:!bg-[#F3F4F6]",
  [ButtonType.LINK]:
    "text-[#111827] underline hover:text-[#818CF8] focus:text-[#4338CA]",
  [ButtonType.DANGEROUS]:
    "bg-white border-[1px] border-[#F43F5E] rounded-[4px] px-[15px] py-[4px] text-[#F43F5E] flex items-center justify-center hover:border-[#FB7185] hover:text-[#FB7185] focus:border-[#BE123C] focus:text-[#BE123C] disabled:!bg-[#F3F4F6]",
};

const Button: FC<ButtonProps> = ({ type, className, children, ...props }) => {
  return (
    <button
      className={`disabled:!border-[#E5E7EB] disabled:!text-[#9CA3AF] font-roboto font-normal text-[14px] leading-[22px] disabled:pointer-events-none ${
        specificTypeClassNameMap[type]
      } ${className ? className : ""}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
