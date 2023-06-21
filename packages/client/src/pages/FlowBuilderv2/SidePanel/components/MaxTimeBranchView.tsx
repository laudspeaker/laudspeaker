import { format } from "date-fns";
import { MaxTimeBranch, TimeType } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";

interface MaxTimeBranchViewProps {
  branch: MaxTimeBranch;
}

const MaxTimeBranchView: FC<MaxTimeBranchViewProps> = ({ branch }) => {
  return (
    <div className="flex flex-col gap-3">
      When waiting until this time window, customers will move to the next step.
      <div className="bg-gray-100 border border-gray-200 rounded gap-5 flex px-2 py-3">
        {branch.timeType === TimeType.TIME_DELAY ? (
          `${branch.delay.days} days ${branch.delay.hours} hours
        ${branch.delay.minutes} min`
        ) : (
          <>
            <div className="flex flex-col">
              <span>From</span>
              <span>To</span>
            </div>
            <div className="flex flex-col font-semibold">
              <span>
                {branch.waitFrom
                  ? format(new Date(branch.waitFrom), "yyyy/MM/dd kk:mm")
                  : "not defined"}
              </span>
              <span>
                {branch.waitTo
                  ? format(new Date(branch.waitTo), "yyyy/MM/dd kk:mm")
                  : "not defined"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MaxTimeBranchView;
