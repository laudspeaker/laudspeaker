import React, { FC } from "react";

interface ProgressBarProps {
  /**
   * @description number 0-100
   */
  percentage: number;
}

const ProgressBar: FC<ProgressBarProps> = ({ percentage }) => {
  return (
    <div className="w-full bg-[#E5E7EB] h-[6px] rounded-[100px] relative">
      <div
        className="bg-[#6366F1] rounded-[100px] h-full"
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
};

export default ProgressBar;
