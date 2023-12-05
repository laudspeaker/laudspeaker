// @ts-nocheck
import React, { FC, ReactNode } from "react";
import { Tooltip as MTTooltip, TooltipProps } from "@material-tailwind/react";

interface CustomTooltipProps {
  children: ReactNode;
  content: ReactNode;
  placement?: string;
  className?: string;
}

const Tooltip: FC<CustomTooltipProps & TooltipProps> = ({
  children,
  content,
  placement = "top",
  className,
}) => {
  return (
    <MTTooltip
      className={`${className} text-center z-[99999999] border shadow-lg`}
      content={content}
      placement={placement}
      color="red"
      nonce={null}
      onResize={() => null}
      onResizeCapture={() => null}
    >
      <div>{children}</div>
    </MTTooltip>
  );
};

export default Tooltip;
