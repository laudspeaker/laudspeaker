import {
  BranchType,
  MaxTimeBranch,
  TimeType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { useAppSelector } from "store/hooks";
import TimeDelayEditor from "./TimeDelayEditor";
import TimeWindowEditor from "./TimeWindowEditor";

interface MaxTimeBranchEditorProps {
  branch: MaxTimeBranch;
  onChangeBranch: (branch: MaxTimeBranch) => void;
}

const MaxTimeBranchEditor: FC<MaxTimeBranchEditorProps> = ({
  branch,
  onChangeBranch,
}) => {
  const { isOnboarding } = useAppSelector((state) => state.flowBuilder);

  return (
    <div className="flex flex-col gap-[10px] pb-[20px] border-b-[1px] border-[]">
      <div className="font-inter font-normal text-[12px] leading-5 text-[#4B5563]">
        Set a maximum amount of time or a time window before moving users to
        another step
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
                    waitFrom: undefined,
                    waitTo: undefined,
                  }),
            })
          }
          className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB]"
        >
          <option value={TimeType.TIME_DELAY}>Time delay</option>
          {!isOnboarding && (
            <option value={TimeType.TIME_WINDOW}>Time window</option>
          )}
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
    </div>
  );
};

export default MaxTimeBranchEditor;
