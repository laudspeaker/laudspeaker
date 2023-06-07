import React from "react";
import {
  JourneyType,
  QueryStatementType,
  QueryType,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";
import FlowEditor from "./FlowEditor";

const FlowBuilderReview = () => {
  const { segments: segmentsSettings, journeyType } = useAppSelector(
    (state) => state.flowBuilder
  );

  return (
    <div className="relative w-full m-[20px] text-[#111827]">
      <div className="h-full flex flex-col gap-[20px]">
        <div className="relative bg-white h-full p-[20px]">
          <div className="font-inter font-semibold text-[16px] leading-[24px]">
            Journey
          </div>
          <div className="h-[calc(100%-24px)]">
            <FlowEditor />
          </div>
        </div>
        <div className="bg-white p-[20px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-[20px] leading-[28px]">
            Condition
          </div>
          <div className="font-inter font-normal text-[14px] leading-[22px]">
            {segmentsSettings.type === SegmentsSettingsType.ALL_CUSTOMERS ? (
              <>
                <span className="font-bold">All customers</span> will enter this
                journey
              </>
            ) : (
              <>
                Customers will enter this journey when they meets the following
                conditions:
              </>
            )}
          </div>
          {segmentsSettings.type === SegmentsSettingsType.CONDITIONAL && (
            <div className="flex gap-[13px] max-h-[100px] overflow-y-scroll">
              <div className="flex flex-col gap-[10px] w-full">
                {segmentsSettings.query.statements.map((statement, i) => (
                  <div className="flex items-center gap-[13px]">
                    <div
                      className={`w-fit px-[12px] py-[5px] border-[1px] border-[#E5E7EB] font-roboto text-[14px] leading-[22px] text-[#4B5563] select-none ${
                        i === 0 ? "opacity-0" : ""
                      }`}
                    >
                      {segmentsSettings.query.type === QueryType.ALL
                        ? "And"
                        : "Or"}
                    </div>
                    <div
                      key={i}
                      className="max-w-[600px] w-full flex items-center gap-[10px] font-inter font-normal text-[14px] leading-[22px] bg-[#F3F4F6] px-[20px] py-[6px]"
                    >
                      <div>{statement.type}</div>
                      {statement.type === QueryStatementType.ATTRIBUTE ? (
                        <>
                          <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                            {statement.key}
                          </div>
                          <div>{statement.comparisonType}</div>
                          <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                            {statement.value}
                          </div>
                        </>
                      ) : (
                        <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                          {statement.segmentId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white p-[20px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-[20px] leading-[28px]">
            Journey type
          </div>
          <div className="font-inter font-normal text-[14px] leading-[22px] flex items-center gap-[10px]">
            <span>This Journey is a</span>
            <span className="px-[8px] py-[10px] bg-[#F3F4F6] border-[1px] border-[#E5E7EB] font-semibold">
              {journeyType === JourneyType.DYNAMIC
                ? "Dynamic"
                : journeyType === JourneyType.STATIC
                ? "Static"
                : "Unspecified"}{" "}
              journey
            </span>
            <span>When new customers meet conditions will be enrolled.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderReview;
