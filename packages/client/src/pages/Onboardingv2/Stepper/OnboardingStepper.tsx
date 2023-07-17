import React, { FC } from "react";
import { OnboardingStep, onboardingStepToNameMap } from "../Onboardingv2";
import stepperIconImage from "./svg/stepper-icon.svg";
import stepperActiveIconImage from "./svg/stepper-active-icon.svg";
import stepperDividerImage from "./svg/stepper-divider.svg";
import stepperDoneIcon from "./svg/stepper-done-icon.svg";

interface OnboardingStepperProps {
  currentStep: OnboardingStep;
}

const OnboardingStepper: FC<OnboardingStepperProps> = ({ currentStep }) => {
  const stepsToShow: OnboardingStep[] = [
    OnboardingStep.CREATE_JOURNEY,
    OnboardingStep.SELECT_CUSTOMERS,
    OnboardingStep.START_JOURNEY,
  ];

  return (
    <div className="flex items-center gap-[20px]">
      {stepsToShow.map((onboardingStep, i) => (
        <React.Fragment key={i}>
          <div
            className={`flex items-center gap-[10px] font-inter text-[16px] leading-[24px] ${
              currentStep === onboardingStep ||
              (currentStep === OnboardingStep.TRACK_PERFORMANCE &&
                onboardingStep === OnboardingStep.START_JOURNEY)
                ? "text-[#6366F1] font-semibold"
                : "text-[#4B5563] font-normal"
            }`}
          >
            <div>
              <img
                src={
                  currentStep === onboardingStep ||
                  (currentStep === OnboardingStep.TRACK_PERFORMANCE &&
                    onboardingStep === OnboardingStep.START_JOURNEY)
                    ? stepperActiveIconImage
                    : i < stepsToShow.indexOf(currentStep) ||
                      currentStep === OnboardingStep.TRACK_PERFORMANCE
                    ? stepperDoneIcon
                    : stepperIconImage
                }
              />
            </div>
            <div>{onboardingStepToNameMap[onboardingStep]}</div>
          </div>
          {i !== stepsToShow.length - 1 && <img src={stepperDividerImage} />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OnboardingStepper;
