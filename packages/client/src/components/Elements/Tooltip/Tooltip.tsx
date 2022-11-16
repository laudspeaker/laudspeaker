import React, { FC, ReactNode } from "react";
import { Tooltip as MTTooltip, TooltipProps } from "@material-tailwind/react";

interface CustomTooltipProps {
  children: ReactNode;
  title: string;
  placement?: string;
  className?: string;
}

const Tooltip: FC<CustomTooltipProps & TooltipProps> = ({
  children,
  title,
  placement = "top",
  className,
}) => {
  return (
    <MTTooltip
      className={`${className} text-center z-[10]`}
      content={title}
      placement={placement}
    >
      <div>{children}</div>
    </MTTooltip>
  );
};

export default Tooltip;
