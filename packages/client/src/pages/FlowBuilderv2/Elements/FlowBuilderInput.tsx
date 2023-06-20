import React, { FC, HTMLInputTypeAttribute } from "react";

interface FlowBuilderInputProps {
  value?: string;
  type?: HTMLInputTypeAttribute;
  onChange?: (value: string) => void;
  className?: string;
}

const FlowBuilderInput: FC<FlowBuilderInputProps> = ({
  value,
  type,
  onChange,
  className,
}) => {
  return (
    <input
      className={`w-full bg-white border-[1px] border-[#E5E7EB] px-[12px] py-[8px] font-normal text-[16px] leading-[24px] text-[#111827] rounded-[2px] ${
        className ? className : ""
      }`}
      type={type}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  );
};

export default FlowBuilderInput;
