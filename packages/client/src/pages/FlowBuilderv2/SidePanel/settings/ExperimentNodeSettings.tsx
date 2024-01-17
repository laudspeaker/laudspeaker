import Button, { ButtonType } from "components/Elements/Buttonv2";
import {
  BranchType,
  ExperimentBranch,
  ExperimentNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import Input from "components/Elements/Inputv2";
import ReactSlider from "react-slider";
import { v4 as uuid } from "uuid";

const ExperimentNodeSettings: FC<
  SidePanelComponentProps<ExperimentNodeData>
> = ({ nodeData, setNodeData, setIsError, showErrors }) => {
  const [total, setTotal] = useState(1);
  const [remaining, setRemaining] = useState(1);

  const handleChangePercent = (index: number, value: number) => {
    const newData = { ...nodeData };
    const clearValue = +(value / 100).toFixed(2);
    newData.branches[index].ratio = +clearValue.toFixed(2);

    if (nodeData.branches.length === 2) {
      newData.branches[index === 1 ? 0 : 1].ratio = +(1 - clearValue).toFixed(
        2
      );
    }

    setNodeData(newData);
  };

  const handleDistribute = () => {
    const newData = { ...nodeData };

    const baseValue = Math.floor((1 / nodeData.branches.length) * 100) / 100;
    const remainder = 1 - baseValue * nodeData.branches.length;
    const distribution = Array(nodeData.branches.length).fill(baseValue);
    distribution[nodeData.branches.length - 1] += remainder;

    distribution.forEach((val, i) => {
      newData.branches[i].ratio = +(val as number).toFixed(2);
    });

    setNodeData(newData);
  };

  const handleAddBranch = () => {
    const newBranch: ExperimentBranch = {
      id: uuid(),
      type: BranchType.EXPERIMENT,
      ratio: 0,
    };
    setNodeData({ ...nodeData, branches: [...nodeData.branches, newBranch] });
  };

  const handleDelete = (index: number) => {
    const newData = { ...nodeData };
    newData.branches.splice(index, 1);

    setNodeData(newData);
    if (newData.branches.length === 2) handleDistribute();
  };

  useEffect(() => {
    const newTotal = nodeData.branches
      .map((brach) => brach.ratio)
      .reduce((acc, el) => acc + el);

    setTotal(newTotal);

    setRemaining(1 - newTotal);
  }, [nodeData]);

  useEffect(() => {
    setIsError(total > 1);
  }, [total]);

  return (
    <>
      <div className="flex flex-col">
        <div className="w-full text-[#18181B] text-base font-inter font-semibold mb-[10px]">
          Ratio
        </div>
        {nodeData.branches.map((el, i) => {
          return (
            <React.Fragment key={el.id}>
              <div key={el.id} className="relative pb-[20px]">
                <div className="w-full flex items-center justify-between">
                  <div className="w-full flex items-center">
                    <span className="text-[#111827] text-[14px] font-inter font-semibold block mr-[6px]">
                      Branch {i + 1}
                    </span>
                    <Input
                      type="number"
                      name="hours"
                      id="hours"
                      min={0}
                      max={100}
                      placeholder="percentage"
                      className="max-w-[70px] ml-auto"
                      value={`${String((el.ratio * 100).toFixed(0))}`}
                      onChange={(str) => handleChangePercent(i, +str)}
                    />
                    <span className="text-[#111827] text-[14px] font-inter font-semibold ml-1">
                      %
                    </span>
                  </div>
                  {nodeData.branches.length > 2 && (
                    <Button
                      type={ButtonType.LINK}
                      onClick={() => {
                        handleDelete(i);
                      }}
                      className="!text-[#EB5757]"
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <ReactSlider
                  className="h-[20px] flex items-center justify-center"
                  thumbClassName="bg-red-500"
                  trackClassName="h-[4px] bg-[#818CF8] rounded"
                  min={0}
                  max={100}
                  value={el.ratio * 100}
                  onChange={(val) => handleChangePercent(i, val)}
                  renderTrack={(props, state) => (
                    <div
                      {...props}
                      className={`${props.className} ${
                        state.index == 0 ? "!bg-[#818CF8]" : "!bg-[#E5E7EB]"
                      }`}
                    />
                  )}
                  renderThumb={(props, state) => (
                    <div
                      {...props}
                      className={`rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border-2 border-[#818CF8]`}
                    />
                  )}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {nodeData.branches.length > 2 && (
        <>
          <hr className="border-[#E5E7EB] mb-5" />

          <div className="pb-5 flex flex-col gap-2.5">
            <div className="font-inter text-[14px] font-semibold leading-[22px]">
              In total: {(total * 100).toFixed()} %
            </div>
            <div className="h-[6px] w-full rounded-[100px] bg-[#E5E7EB] relative">
              <div
                className={`h-full rounded-[100px] ${
                  total === 1 ? "bg-[#22C55E]" : "bg-[#FACC15]"
                }`}
                style={{
                  width: `${(total > 1 ? 1 : total) * 100}%`,
                }}
              />
            </div>
            {remaining > 0 && (
              <div className="font-roboto text-[14px] leading-[22px]">
                Remaining {(remaining * 100).toFixed()}% to be distributed
              </div>
            )}
            {remaining < 0 && (
              <div className="font-roboto text-[14px] leading-[22px] text-[#EB5757]">
                Exceeded by {(remaining * -100).toFixed()}%. Please reduce to
                100%.
              </div>
            )}
          </div>
        </>
      )}
      <div className="relative flex gap-2.5 pb-5">
        {nodeData.branches.length === 2 && (
          <div className="w-[calc(100%+20px)] absolute left-[-20px] z-10 bottom-0 border-[#E5E7EB] border-t-[1px]" />
        )}
        <Button
          type={ButtonType.SECONDARY}
          onClick={handleAddBranch}
          className="!text-[#111827] !border-[#E5E7EB]"
        >
          Add branch
        </Button>
        <Button
          type={ButtonType.SECONDARY}
          onClick={handleDistribute}
          className="!text-[#111827] !border-[#E5E7EB]"
        >
          Distribute evenly
        </Button>
      </div>
    </>
  );
};

export default ExperimentNodeSettings;
