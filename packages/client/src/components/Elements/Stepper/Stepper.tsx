import React, { FC } from "react";

export interface StepperProps {
  activeStep: number;
  onChange: (stepIndex: number) => void;
  steps: string[];
}

const Stepper: FC<StepperProps> = ({ activeStep, onChange, steps }) => {
  return (
    <div className="flex justify-start items-center gap-[20px]">
      {steps.map((step, index) => (
        <div
          className={`cursor-pointer border-b-[5px] ${
            index === activeStep ? "border-cyan-500" : "border-gray-300"
          }`}
          onClick={() => onChange(index)}
        >
          <span className={`${index === activeStep ? "" : "grayscale"}`}>
            ✅
          </span>
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
};

export default Stepper;
