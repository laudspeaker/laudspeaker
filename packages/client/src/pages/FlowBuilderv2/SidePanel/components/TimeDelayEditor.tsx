import { DelayData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { useAppSelector } from "store/hooks";
import onboardingCursorImage from "../../../Onboardingv2/svg/onboarding-cursor.svg";

interface TimeDelayEditorProps {
  delay: DelayData;
  onChange: (delay: DelayData) => void;
}

const TimeDelayEditor: FC<TimeDelayEditorProps> = ({ delay, onChange }) => {
  const { isOnboarding, isOnboardingWaitUntilTimeSettingTooltipVisible } =
    useAppSelector((store) => store.flowBuilder);

  return (
    <div className="relative flex items-center gap-[10px] w-full h-[32px] mt-[1px] p-[1px]">
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
        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
      />

      <div>:</div>

      <input
        type="number"
        value={delay.hours || undefined}
        onChange={(e) =>
          +e.target.value >= 0 && onChange({ ...delay, hours: +e.target.value })
        }
        placeholder="Hours"
        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
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
        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
      />
      {isOnboarding && isOnboardingWaitUntilTimeSettingTooltipVisible && (
        <>
          <div className="absolute w-full bottom-[-60px] left-0 p-[10px] bg-black text-white font-medium">
            Add 1 hour to Time Delay trigger
          </div>
          <img
            className="absolute pointer-events-none -bottom-[40%] left-[65%] -translate-x-1/2 "
            src={onboardingCursorImage}
            alt=""
          />
        </>
      )}
    </div>
  );
};

export default TimeDelayEditor;
