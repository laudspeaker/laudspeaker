import React from "react";
import { Stepper as MuiStepper, Step, StepLabel } from "@mui/material";

export interface StepperProps {
  steps: Array<string>;
  activeStep: number;
  alternativeLabel?: boolean;
  orientation?: "vertical" | "horizontal";
  connector?: React.ReactElement;
  StepIconComponent?: React.ElementType;
  icon?: React.ReactNode;
  sx?: object;
}

const Stepper = (props: StepperProps) => {
  const {
    steps,
    activeStep,
    alternativeLabel,
    orientation,
    connector,
    StepIconComponent,
    icon,
    sx,
  } = props;

  return (
    <MuiStepper
      orientation={orientation}
      activeStep={activeStep}
      connector={connector}
      alternativeLabel={alternativeLabel}
      sx={sx}
    >
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel StepIconComponent={StepIconComponent} icon={icon}>
            {label}
          </StepLabel>
        </Step>
      ))}
    </MuiStepper>
  );
};

export default Stepper;
