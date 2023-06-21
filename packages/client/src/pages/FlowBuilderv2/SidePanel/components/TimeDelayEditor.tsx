import { DelayData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";

interface TimeDelayEditorProps {
  delay: DelayData;
  onChange: (delay: DelayData) => void;
}

const TimeDelayEditor: FC<TimeDelayEditorProps> = ({ delay, onChange }) => {
  return (
    <div className="flex items-center gap-[10px] w-full h-[32px] mt-[1px] p-[1px]">
      <div className="font-inter font-normal text-[14px] leading-[22px]">
        Wait
      </div>

      <input
        type="number"
        value={delay.days || undefined}
        onChange={(e) =>
          +e.target.value >= 0 && onChange({ ...delay, days: +e.target.value })
        }
        placeholder="Days"
        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
      />

      <div>:</div>

      <input
        type="number"
        value={delay.hours || undefined}
        onChange={(e) =>
          +e.target.value >= 0 && onChange({ ...delay, hours: +e.target.value })
        }
        placeholder="Hours"
        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
      />

      <div>:</div>

      <input
        type="number"
        value={delay.minutes || undefined}
        onChange={(e) =>
          +e.target.value >= 0 &&
          onChange({ ...delay, minutes: +e.target.value })
        }
        placeholder="Mins"
        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
      />
    </div>
  );
};

export default TimeDelayEditor;
