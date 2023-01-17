import React, { FC } from "react";
import tick from "../../../assets/images/tick.svg";

export interface StepperProps {
  activeStep: number;
  onChange?: (stepIndex: number) => void;
  steps: string[];
}

const Stepper: FC<StepperProps> = ({ activeStep, onChange, steps }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-start items-center">
      {steps.map((step, index) => (
        <div
          className={`relative w-full ${
            index === activeStep
              ? "border-cyan-500 text-cyan-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div
            className={`h-[30px] px-6 flex justify-start lg:justify-between items-center gap-[5px] cursor-pointer first:rounded-sm`}
            onClick={() => onChange && onChange(index)}
          >
            {index < activeStep ? (
              <img className="w-[30px] aspect-square" src={tick} />
            ) : (
              <span
                className={`w-[25px] h-[25px] ${
                  index === activeStep ? "bg-cyan-500" : "bg-gray-400"
                } rounded-full text-white border-[1px] flex justify-center items-center`}
              >
                {index + 1}
              </span>
            )}
            <span>{step}</span>
          </div>
          <div
            className={`absolute w-full hidden lg:block ${
              index === activeStep
                ? "bg-cyan-500 h-[3px]"
                : "bg-gray-400 h-[2px]"
            } bottom-[-5px]`}
          ></div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;
