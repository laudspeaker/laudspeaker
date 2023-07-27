import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useInterval } from "react-use";
import OnboardingSandbox from "./OnboardingSandbox";
import SelectCustomers from "./SelectCustomers";
import StartJourney from "./StartJourney";
import OnboardingStepper from "./Stepper/OnboardingStepper";
import buildJourneysImage from "./svg/build-journeys.svg";
import segmentCustomersImage from "./svg/segment-customers.svg";
import trackMetricsImage from "./svg/track-metrics.svg";
import TrackPerformance from "./TrackPerformance";

export enum OnboardingStep {
  CREATE_JOURNEY,
  SELECT_CUSTOMERS,
  START_JOURNEY,
  TRACK_PERFORMANCE,
}

export const onboardingStepToNameMap: Record<OnboardingStep, string> = {
  [OnboardingStep.CREATE_JOURNEY]: "Create a journey",
  [OnboardingStep.SELECT_CUSTOMERS]: "Select Customers",
  [OnboardingStep.START_JOURNEY]: "Start the Journey",
  [OnboardingStep.TRACK_PERFORMANCE]: "Track performance",
};

const Onboardingv2 = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>();
  const [renderFirstStep, setRenderFirstStep] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!renderFirstStep) return;

    setCurrentStep(OnboardingStep.CREATE_JOURNEY);
    setRenderFirstStep(false);
  }, [renderFirstStep]);

  useInterval(() => {
    if (!buttonRef.current || currentStep !== undefined) return;

    setShowScrollButton(
      buttonRef.current.offsetTop +
        buttonRef.current.clientHeight -
        window.scrollY >
        window.innerHeight
    );
  }, 100);

  const stepComponentMap: Record<OnboardingStep, ReactNode> = {
    [OnboardingStep.CREATE_JOURNEY]: (
      <OnboardingSandbox
        onSandboxComplete={() =>
          setCurrentStep(OnboardingStep.SELECT_CUSTOMERS)
        }
      />
    ),
    [OnboardingStep.SELECT_CUSTOMERS]: (
      <SelectCustomers
        onSendEmailClick={() => setCurrentStep(OnboardingStep.START_JOURNEY)}
      />
    ),
    [OnboardingStep.START_JOURNEY]: (
      <StartJourney
        onStartClick={() => setCurrentStep(OnboardingStep.TRACK_PERFORMANCE)}
      />
    ),
    [OnboardingStep.TRACK_PERFORMANCE]: <TrackPerformance />,
  };

  return currentStep !== undefined ? (
    <div
      className={`min-h-screen h-screen flex flex-col gap-[20px] p-[20px] font-inter text-[16px] font-normal text-[#111827] leading-[24px] ${
        currentStep === OnboardingStep.SELECT_CUSTOMERS
          ? "bg-[#F9FAFB]"
          : "bg-white"
      }`}
    >
      <div className="flex justify-between px-[20px] pt-[20px]">
        <button
          className={`underline text-black font-inter font-normal text-[16px] leading-[24px] ${
            currentStep === OnboardingStep.TRACK_PERFORMANCE
              ? "opacity-0 pointer-events-none"
              : ""
          }`}
          onClick={
            currentStep === OnboardingStep.CREATE_JOURNEY
              ? () => {
                  setCurrentStep(undefined);
                  setRenderFirstStep(true);
                }
              : () =>
                  setCurrentStep(
                    currentStep === OnboardingStep.SELECT_CUSTOMERS
                      ? OnboardingStep.CREATE_JOURNEY
                      : OnboardingStep.SELECT_CUSTOMERS
                  )
          }
        >
          {currentStep === OnboardingStep.CREATE_JOURNEY ? "Reset" : "Back"}
        </button>

        <OnboardingStepper currentStep={currentStep} />

        <button onClick={() => window.history.back()}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 30L30 2M2 2L30 30"
              stroke="#111827"
              strokeWidth="3.375"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {stepComponentMap[currentStep]}
    </div>
  ) : (
    <div className="bg-white w-full min-h-screen p-[60px] flex justify-center text-justify">
      <div className="max-w-[1440px]">
        <button
          className="fixed top-[40px] right-[40px]"
          onClick={() => window.history.back()}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 30L30 2M2 2L30 30"
              stroke="#111827"
              strokeWidth="3.375"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {showScrollButton && (
          <button
            className="fixed bottom-[94px] right-[60px]"
            onClick={() =>
              buttonRef.current &&
              window.scrollTo({
                top:
                  buttonRef.current.offsetTop - buttonRef.current.clientHeight,
              })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="55"
              height="48"
              viewBox="0 0 55 48"
              fill="none"
            >
              <path
                d="M44.6875 10.5L27.5 25.5L10.3125 10.5M44.6875 22.5L27.5 37.5L10.3125 22.5"
                stroke="#4B5563"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className="mt-[44px] text-black text-[56px] font-inter font-semibold leading-[68px] flex justify-center">
          Unleash Your Messaging Potential
        </div>

        <div className="mt-[40px] flex justify-center items-center gap-[40px]">
          <div className="rounded-[25px] w-full">
            <img src={buildJourneysImage} />
          </div>
          <div className="rounded-[25px] w-full">
            <img src={segmentCustomersImage} />
          </div>
          <div className="rounded-[25px] w-full">
            <img src={trackMetricsImage} />
          </div>
        </div>

        <div className="mt-[40px] flex items-center justify-center">
          Let us guide you to maximize our platform's features
        </div>

        <div className="mt-[40px] flex items-center justify-center">
          <button
            className="px-[30px] py-[10px] rounded-[30px] bg-[#6366F1] flex items-center justify-center text-white"
            onClick={() => setCurrentStep(OnboardingStep.CREATE_JOURNEY)}
            ref={buttonRef}
          >
            Let's start
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboardingv2;
