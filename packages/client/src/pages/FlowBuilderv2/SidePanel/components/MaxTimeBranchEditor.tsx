import {
  BranchType,
  MaxTimeBranch,
  TimeType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import TimeDelayEditor from "./TimeDelayEditor";
import TimeWindowEditor from "./TimeWindowEditor";

interface MaxTimeBranchEditorProps {
  branch: MaxTimeBranch;
  onDeleteBranch: () => void;
  onChangeBranch: (branch: MaxTimeBranch) => void;
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
      <div className="font-inter font-normal text-[12px] leading-[20px] text-[#4B5563]">
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
        <TimeDelayEditor
          delay={branch.delay}
          onChange={(delay) => onChangeBranch({ ...branch, delay })}
        />
      ) : (
        <TimeWindowEditor
          from={branch.waitFrom}
          to={branch.waitTo}
          onChangeFrom={(from) => onChangeBranch({ ...branch, waitFrom: from })}
          onChangeTo={(to) => onChangeBranch({ ...branch, waitTo: to })}
        />
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
