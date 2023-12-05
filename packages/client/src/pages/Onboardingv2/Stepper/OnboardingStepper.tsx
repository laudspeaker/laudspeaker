import React, { FC } from "react";
import { OnboardingPage, onboardingStepToNameMap } from "../Onboardingv2";
import stepperIconImage from "./svg/stepper-icon.svg";
import stepperActiveIconImage from "./svg/stepper-active-icon.svg";
import stepperDividerImage from "./svg/stepper-divider.svg";
import stepperDoneIcon from "./svg/stepper-done-icon.svg";

interface OnboardingStepperProps {
  currentStep: Exclude<OnboardingPage, OnboardingPage.MAIN_PAGE>;
}

const OnboardingStepper: FC<OnboardingStepperProps> = ({ currentStep }) => {
  const stepsToShow: OnboardingPage[] = [
    OnboardingPage.CREATE_JOURNEY,
    OnboardingPage.SELECT_CUSTOMERS,
    OnboardingPage.START_JOURNEY,
  ];

  return (
    <div className="flex items-center gap-5">
      {stepsToShow.map((onboardingStep, i) => (
        <React.Fragment key={i}>
          <div
            className={`flex items-center gap-[10px] font-inter text-base ${
              currentStep === onboardingStep ||
              (currentStep === OnboardingPage.TRACK_PERFORMANCE &&
                onboardingStep === OnboardingPage.START_JOURNEY)
                ? "text-[#6366F1] font-semibold"
                : "text-[#4B5563] font-normal"
            }`}
          >
            <div>
              <img
                src={
                  currentStep === onboardingStep ||
                  (currentStep === OnboardingPage.TRACK_PERFORMANCE &&
                    onboardingStep === OnboardingPage.START_JOURNEY)
                    ? stepperActiveIconImage
                    : i < stepsToShow.indexOf(currentStep) ||
                      currentStep === OnboardingPage.TRACK_PERFORMANCE
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
