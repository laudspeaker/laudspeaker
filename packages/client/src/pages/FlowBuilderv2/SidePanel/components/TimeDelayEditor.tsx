import { DelayData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";

interface TimeDelayEditorProps {
  delay: DelayData;
  onChange: (delay: DelayData) => void;
}

const TimeDelayEditor: FC<TimeDelayEditorProps> = ({ delay, onChange }) => {
  return (
    <div className="flex gap-[10px]">
      <div className="flex gap-[5px] items-center">
        <input
          type="number"
          value={delay.days}
          onChange={(e) =>
            +e.target.value >= 0 &&
            onChange({ ...delay, days: +e.target.value })
          }
          className="w-[63px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
        />
        <span className="font-inter font-normal text-[14px] leading-[22px]">
          days
        </span>
      </div>

      <div className="flex gap-[5px] items-center">
        <input
          type="number"
          value={delay.hours}
          onChange={(e) =>
            +e.target.value >= 0 &&
            onChange({ ...delay, hours: +e.target.value })
          }
          className="w-[57px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
        />
        <span className="font-inter font-normal text-[14px] leading-[22px]">
          hours
        </span>
      </div>

      <div className="flex gap-[5px] items-center">
        <input
          type="number"
          value={delay.minutes}
          onChange={(e) =>
            +e.target.value >= 0 &&
            onChange({ ...delay, minutes: +e.target.value })
          }
          className="w-[71px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
        />
        <span className="font-inter font-normal text-[14px] leading-[22px]">
          min
        </span>
      </div>
    </div>
  );
};

export default TimeDelayEditor;
