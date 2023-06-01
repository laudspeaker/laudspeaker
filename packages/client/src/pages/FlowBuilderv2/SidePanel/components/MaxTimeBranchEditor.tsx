import {
  Branch,
  BranchType,
  MaxTimeBranch,
  TimeType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";

interface MaxTimeBranchEditorProps {
  branch: MaxTimeBranch;
  onDeleteBranch: () => void;
  onChangeBranch: (branch: Branch) => void;
}

const MaxTimeBranchEditor: FC<MaxTimeBranchEditorProps> = ({
  branch,
  onDeleteBranch,
  onChangeBranch,
}) => {
  const handleWaitFromChange = (date: Date) => {
    if (branch.timeType !== TimeType.TIME_WINDOW) return;

    if (date > new Date(branch.waitTo)) {
      onChangeBranch({
        ...branch,
        waitFrom: branch.waitTo,
      });
      return;
    }

    onChangeBranch({
      ...branch,
      waitFrom: date.toUTCString(),
    });
  };

  const handleWaitToChange = (date: Date) => {
    if (branch.timeType !== TimeType.TIME_WINDOW) return;

    if (date < new Date(branch.waitFrom)) {
      onChangeBranch({
        ...branch,
        waitTo: branch.waitFrom,
      });
      return;
    }

    onChangeBranch({
      ...branch,
      waitTo: date.toUTCString(),
    });
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="font-inter font-normal text-[16px] leading-[24px] text-[#4B5563]">
        Description Description Description Des
      </div>
      <div>
        <select
          value={branch.timeType}
          onChange={(e) =>
            onChangeBranch({
              ...branch,
              type: BranchType.MAX_TIME,
              ...(e.target.value === TimeType.TIME_DELAY
                ? {
                    timeType: TimeType.TIME_DELAY,
                    delay: {
                      days: 0,
                      hours: 0,
                      minutes: 0,
                    },
                  }
                : {
                    timeType: TimeType.TIME_WINDOW,
                    waitFrom: new Date().toUTCString(),
                    waitTo: new Date().toUTCString(),
                  }),
            })
          }
          className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
        >
          <option value={TimeType.TIME_DELAY}>Time delay</option>
          <option value={TimeType.TIME_WINDOW}>Time window</option>
        </select>
      </div>
      {branch.timeType === TimeType.TIME_DELAY ? (
        <div className="flex gap-[10px]">
          <div className="flex gap-[5px] items-center">
            <input
              type="number"
              value={branch.delay.days}
              onChange={(e) =>
                +e.target.value >= 0 &&
                onChangeBranch({
                  ...branch,
                  delay: { ...branch.delay, days: +e.target.value },
                })
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
              value={branch.delay.hours}
              onChange={(e) =>
                +e.target.value >= 0 &&
                onChangeBranch({
                  ...branch,
                  delay: { ...branch.delay, hours: +e.target.value },
                })
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
              value={branch.delay.minutes}
              onChange={(e) =>
                +e.target.value >= 0 &&
                onChangeBranch({
                  ...branch,
                  delay: { ...branch.delay, minutes: +e.target.value },
                })
              }
              className="w-[71px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
            />
            <span className="font-inter font-normal text-[14px] leading-[22px]">
              min
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
            <div>Wait from</div>
            <input
              value={new Date(
                new Date(branch.waitFrom).getTime() -
                  new Date().getTimezoneOffset() * 60 * 1000
              )
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => handleWaitFromChange(new Date(e.target.value))}
              type="datetime-local"
            />
          </div>
          <div className="flex justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
            <div>To</div>
            <input
              value={new Date(
                new Date(branch.waitTo).getTime() -
                  new Date().getTimezoneOffset() * 60 * 1000
              )
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => handleWaitToChange(new Date(e.target.value))}
              type="datetime-local"
            />
          </div>
        </>
      )}
      <div
        className="cursor-pointer font-roboto font-normal text-[14px] leading-[22px] underline text-[#EB5757]"
        onClick={onDeleteBranch}
      >
        Delete branch
      </div>
    </div>
  );
};

export default MaxTimeBranchEditor;
