import React, { FC, MouseEvent, ReactNode } from "react";

interface FlowBuilderButtonProps {
  children?: ReactNode;
  onClick?: (e: MouseEvent) => void;
  className?: string;
}

const FlowBuilderButton: FC<FlowBuilderButtonProps> = ({
  children,
  onClick,
  className,
}) => {
  return (
    <div
      className={`flex justify-center items-center rounded-[4px] select-none cursor-pointer bg-[#6366F1] border-[1px] border-[#6366F1] text-white px-[15px] py-[4px] font-roboto text-[14px] leading-[22px] ${
        className ? className : ""
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default FlowBuilderButton;
