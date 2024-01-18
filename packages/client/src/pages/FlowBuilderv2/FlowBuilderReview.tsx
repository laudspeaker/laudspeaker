import React from "react";
import {
  JourneyType,
  QueryStatementType,
  QueryType,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";
import FilterViewer from "./FilterViewer/FilterViewer";
import FlowEditor from "./FlowEditor";

const FlowBuilderReview = () => {
  const { segments: segmentsSettings, journeyType } = useAppSelector(
    (state) => state.flowBuilder
  );

  return (
    <div className="relative w-full m-5 text-[#111827] overflow-y-scroll">
      <div className="h-full flex flex-col gap-5">
        <div className="relative bg-white h-full p-5 flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-base">Journey</div>
          <div className="min-h-[420px] h-full">
            <FlowEditor isViewMode />
          </div>
        </div>
        <div className="bg-white p-5 flex flex-col gap-[10px]">
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
            <FilterViewer settingsQuery={segmentsSettings.query} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderReview;
