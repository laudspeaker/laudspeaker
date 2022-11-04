import React, { FC, ReactNode } from "react";
import { Tooltip as MTTooltip, TooltipProps } from "@material-tailwind/react";

interface CustomTooltipProps {
  children: ReactNode;
  title: string;
  placement?: string;
}

const Tooltip: FC<CustomTooltipProps & TooltipProps> = ({
  children,
  title,
  placement = "top",
}) => {
  return (
    <MTTooltip content={title} placement={placement}>
      <div>{children}</div>
    </MTTooltip>
  );
};

export default Tooltip;
