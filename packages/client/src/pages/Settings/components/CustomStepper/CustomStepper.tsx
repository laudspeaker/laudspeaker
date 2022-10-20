import React from "react";
import Stepper from "components/Stepper";
import DoneIcon from "@mui/icons-material/Done";
import { StepIconProps } from "@mui/material/StepIcon";
import { CheckIcon } from "@heroicons/react/20/solid";

const classNames = (...classes: any[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface CustomStepperProps {
  steps?: string[];
  activeStep: number;
}

const CustomStepper = ({ steps, activeStep }: CustomStepperProps) => {
  const stepperSteps = steps || [
    "Select Provider",
    "Configure settings",
    "Additional Settings",
  ];

  return (
    <ol role="list" className="overflow-hidden p-[10px]">
      {stepperSteps?.map((step, stepIdx) => (
        <li
          key={step}
          className={classNames(
            stepIdx !== stepperSteps.length - 1 ? "pb-10" : "",
            "relative"
          )}
        >
          {stepIdx < activeStep ? (
            <>
              {stepIdx !== stepperSteps.length - 1 ? (
                <div
                  className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-emerald-600"
                  aria-hidden="true"
                />
              ) : null}
              <div className="group relative flex items-start">
                <span className="flex h-9 items-center">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 group-hover:bg-emerald-800">
                    <CheckIcon
                      className="h-5 w-5 text-white"
                      aria-hidden="true"
                    />
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{step}</span>
                  <span className="text-sm text-gray-500">{step}</span>
                </span>
              </div>
            </>
          ) : stepIdx === activeStep ? (
            <>
              {stepIdx !== stepperSteps.length - 1 ? (
                <div
                  className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                  aria-hidden="true"
                />
              ) : null}
              <div
                className="group relative flex items-start"
                aria-current="step"
              >
                <span className="flex h-9 items-center" aria-hidden="true">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-600 bg-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-emerald-600">
                    {step}
                  </span>
                  <span className="text-sm text-gray-500">{step}</span>
                </span>
              </div>
            </>
          ) : (
            <>
              {stepIdx !== stepperSteps.length - 1 ? (
                <div
                  className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                  aria-hidden="true"
                />
              ) : null}
              <div className="group relative flex items-start">
                <span className="flex h-9 items-center" aria-hidden="true">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-gray-500">
                    {step}
                  </span>
                  <span className="text-sm text-gray-500">{step}</span>
                </span>
              </div>
            </>
          )}
        </li>
      ))}
    </ol>
    // <Stepper
    //   steps={stepperSteps}
    //   activeStep={activeStep}
    //   orientation={"vertical"}
    //   connector={<></>}
    //   StepIconComponent={CustomStepIcon}
    //   sx={{
    //     "& .MuiStep-vertical": {
    //       borderTop: "1px solid #D3D3D3",
    //     },
    //     "& .MuiStepLabel-root": {
    //       padding: "16px 24px",
    //     },
    //   }}
    // />
  );
};

export default CustomStepper;
