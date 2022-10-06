import React from "react";
import Stepper from "components/Stepper";
import DoneIcon from "@mui/icons-material/Done";
import { StepIconProps } from "@mui/material/StepIcon";

export interface CustomStepperProps {
  activeStep: number;
}

const CustomStepper = ({ activeStep }: CustomStepperProps) => {
  const stepperSteps = [
    "Select Provider",
    "Configure Settings",
    "Additional Settings",
  ];

  const CustomStepIcon = (props: StepIconProps) => {
    const { completed } = props;
    const icons: { [index: string]: React.ReactElement } = {
      1: <DoneIcon />,
      2: <DoneIcon />,
      3: <DoneIcon />,
    };
    return (
      <div
        style={{
          zIndex: 1,
          backgroundColor: `${completed ? "#6CCEB6" : "#D3D3D3"}`,
          color: "#fff",
          width: 40,
          height: 40,
          display: "flex",
          borderRadius: "50%",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0px 8px 16px -6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {icons[String(props.icon)]}
      </div>
    );
  };
  return (
    <Stepper
      steps={stepperSteps}
      activeStep={activeStep}
      orientation={"vertical"}
      connector={<></>}
      StepIconComponent={CustomStepIcon}
      sx={{
        "& .MuiStep-vertical": {
          borderTop: "1px solid #D3D3D3",
        },
        "& .MuiStepLabel-root": {
          padding: "16px 24px",
        },
      }}
    />
  );
};

export default CustomStepper;
