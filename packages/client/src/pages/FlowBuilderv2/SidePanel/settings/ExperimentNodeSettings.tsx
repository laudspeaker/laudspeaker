import Button, { ButtonType } from "components/Elements/Buttonv2";
import {
  BranchType,
  ExperimentBranch,
  ExperimentNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useState } from "react";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import Input from "components/Elements/Inputv2";
import ReactSlider from "react-slider";
import { v4 as uuid } from "uuid";

const ExperimentNodeSettings: FC<
  SidePanelComponentProps<ExperimentNodeData>
> = ({ nodeData, setNodeData, setIsError, showErrors }) => {
  const handleChangePercent = (index: number, value: number) => {
    const newData = { ...nodeData };
    const clearValue = +(value / 100).toFixed(2);
    newData.branches[index].ratio = +clearValue.toFixed(2);

    if (nodeData.branches.length === 2) {
      newData.branches[index === 1 ? 0 : 1].ratio = 1 - clearValue;
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
        </>
      )}
      <div className="relative flex gap-[10px] pb-5">
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
