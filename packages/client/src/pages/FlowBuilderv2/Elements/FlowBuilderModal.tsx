import React, { FC, ReactNode } from "react";
import { createPortal } from "react-dom";

interface FlowBuilderModalProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
  onClose?: () => void;
}

const FlowBuilderModal: FC<FlowBuilderModalProps> = ({
  children,
  isOpen,
  className = "",
  onClose,
}) => {
  const rootDiv = document.querySelector("#root");
  return (
    <>
      {rootDiv &&
        isOpen &&
        createPortal(
          <div
            className="fixed top-0 left-0 w-screen h-screen z-[9999999991] bg-[#111827] bg-opacity-20"
            onClick={onClose}
          >
            <div
              className={`${className} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[416px] bg-white px-[32px] pt-[32px] pb-[24px] text-[#111827]`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>,
          rootDiv
        )}
    </>
  );
};

export default FlowBuilderModal;
