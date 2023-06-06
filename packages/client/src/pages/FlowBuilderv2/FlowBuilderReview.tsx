import React from "react";
import {
  JourneyType,
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
