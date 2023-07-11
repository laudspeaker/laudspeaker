import React, { FC } from "react";
import { OnboardingStep } from "../Onboardingv2";
import stepperIconImage from "./svg/stepper-icon.svg";
import stepperActiveIconImage from "./svg/stepper-active-icon.svg";
import stepperDividerImage from "./svg/stepper-divider.svg";
import stepperDoneIcon from "./svg/stepper-done-icon.svg";

interface OnboardingStepperProps {
  currentStep: OnboardingStep;
}

const OnboardingStepper: FC<OnboardingStepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center gap-[20px]">
      {Object.values(OnboardingStep).map((onboardingStep, i) => (
        <React.Fragment key={i}>
          <div
            className={`flex items-center gap-[10px] font-inter text-[16px] leading-[24px] ${
              currentStep === onboardingStep
                ? "text-[#6366F1] font-semibold"
                : "text-[#4B5563] font-normal"
            }`}
          >
            <div>
              <img
                src={
                  currentStep === onboardingStep
                    ? stepperActiveIconImage
                    : i < Object.values(OnboardingStep).indexOf(currentStep)
                    ? stepperDoneIcon
                    : stepperIconImage
                }
              />
            </div>
            <div>{onboardingStep}</div>
          </div>
          {i !== Object.values(OnboardingStep).length - 1 && (
            <img src={stepperDividerImage} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OnboardingStepper;
