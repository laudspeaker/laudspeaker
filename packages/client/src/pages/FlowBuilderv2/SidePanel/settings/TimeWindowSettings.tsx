import Select from "components/Elements/Selectv2";
import { isAfter, isBefore } from "date-fns";
import {
  TimeWindowNodeData,
  TimeWindowTypes,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect } from "react";
import TimeWindowEditor from "../components/TimeWindowEditor";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";

const TimeWindowSettings: FC<SidePanelComponentProps<TimeWindowNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  useEffect(() => {
    if (!nodeData?.windowType)
      setNodeData({
        ...nodeData,
        windowType: TimeWindowTypes.SPEC_DATES,
      });
  }, [nodeData]);

  return (
    <>
      {nodeData.windowType && (
        <Select
          id="time-window-type-select"
          value={nodeData.windowType}
          onChange={(val) =>
            setNodeData({
              ...nodeData,
              windowType: val,
            })
          }
          className="mb-[10px]"
          options={[
            {
              key: TimeWindowTypes.SPEC_DATES,
              title: "Specific days",
            },
            {
              key: TimeWindowTypes.SPEC_WEEK_DAYS,
              title: "Specific days of the week",
            },
          ]}
        />
      )}
      {nodeData.windowType === TimeWindowTypes.SPEC_DATES ? (
        <TimeWindowEditor
          from={nodeData.from}
          to={nodeData.to}
          onChangeFrom={(from) => setNodeData({ ...nodeData, from })}
          onChangeTo={(to) => setNodeData({ ...nodeData, to })}
        />
      ) : nodeData.windowType === TimeWindowTypes.SPEC_WEEK_DAYS ? (
        <>
          <div className="flex mb-[10px]">
            {["S", "M", "T", "W", "T", "F", "S"].map((el, i) => {
              const isChecked = !!nodeData?.onDays?.[i];

              return (
                <div
                  id={`time-window-week-day-option-${i}`}
                  key={i}
                  className={`${
                    isChecked && "!bg-[#6366F1] !border-[#6366F1] !text-white"
                  } py-[5px] w-full text-center bg-white border border-[#E5E7EB] cursor-pointer select-none hover:bg-[#E0E7FF] text-[#111827] font-roboto text-[14px] leading-[22px] transition-all`}
                  onClick={() => {
                    const newWeeklyOn = [...(nodeData.onDays || [])];
                    newWeeklyOn[i] = +!isChecked;

                    setNodeData({
                      ...nodeData,
                      onDays: newWeeklyOn,
                    });
                  }}
                >
                  {el}
                </div>
              );
            })}
          </div>
          <div className="flex w-full items-center">
            <div className="text-[#111827] font-inter text-[14px] leading-[22px] w-[50px]">
              From
            </div>
            <input
              value={nodeData.fromTime}
              onChange={(e) => {
                if (
                  isAfter(
                    new Date(`12.12.12 ${e.target.value}`),
                    new Date(`12.12.12 ${nodeData.toTime}`)
                  )
                ) {
                  return;
                }

                setNodeData({
                  ...nodeData,
                  fromTime: e.target.value,
                });
              }}
              type="time"
              className="w-full h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-sm border border-[#E5E7EB]"
              placeholder="Select date"
            />
          </div>
          <div className="flex w-full items-center mt-[10px]">
            <div className="text-[#111827] font-inter text-[14px] leading-[22px] w-[50px]">
              To
            </div>
            <input
              value={nodeData.toTime}
              onChange={(e) => {
                if (
                  isBefore(
                    new Date(`12.12.12 ${e.target.value}`),
                    new Date(`12.12.12 ${nodeData.fromTime}`)
                  )
                ) {
                  return;
                }

                setNodeData({
                  ...nodeData,
                  toTime: e.target.value,
                });
              }}
              type="time"
              className="w-full h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-sm border border-[#E5E7EB]"
              placeholder="Select date"
            />
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default TimeWindowSettings;
