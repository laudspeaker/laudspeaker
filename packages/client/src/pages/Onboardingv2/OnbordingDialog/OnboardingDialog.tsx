import Button, { ButtonType } from "components/Elements/Buttonv2";
import React, { FC, ReactNode } from "react";
import { createPortal } from "react-dom";

interface OnboardingDialogProps {
  children: ReactNode;
  onNextClick: () => void;
  position: {
    top: number;
    left: number;
  };
}

const OnboardingDialog: FC<OnboardingDialogProps> = ({
  children,
  onNextClick,
  position,
}) => {
  const bodyElement = document.body;

  return (
    <div className="absolute w-full h-full top-0 left-0 font-inter text-[16px] font-normal text-[#111827] leading-[24px] z-[20] flex justify-center items-center">
      <div className="relative w-full h-full">
        <div
          className="absolute p-[24px] flex flex-col gap-4 w-[348px] h-fit bg-white rounded-lg"
          style={{
            top: position.top,
            left: position.left,
            boxShadow:
              "0px 11px 15px 0px rgba(71, 73, 171, 0.20), 0px 9px 46px 0px rgba(71, 73, 171, 0.12)",
          }}
        >
          {children}
          <div className="flex items-center justify-end">
            <Button type={ButtonType.PRIMARY} onClick={onNextClick}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDialog;
