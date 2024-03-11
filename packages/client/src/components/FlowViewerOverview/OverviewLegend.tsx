import { FC } from "react";
import Dot from "components/Dot";
import getNumericFormat from "utils/getNumericFormat";

interface OverviewLegendProps {
  title: string;
  percentage: number;
  conversionRate: number;
  color: string;
}

const OverviewLegend: FC<OverviewLegendProps> = ({
  title,
  percentage,
  color,
  conversionRate,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-normal text-sm text-[#4B5563] flex gap-1 items-center">
        <Dot color={color} />
        <span className="border-b border-dashed border-[#111827] hover:bg-[#F3F4F6]">
          {title}
        </span>
      </div>
      <div className="flex gap-1 items-end font-inter">
        <span className="font-medium text-3xl">{percentage}%</span>
        <span className="font-normal text-sm mb-0.5 text-[#4B5563]">
          {getNumericFormat(conversionRate)}
        </span>
      </div>
    </div>
  );
};

export default OverviewLegend;
