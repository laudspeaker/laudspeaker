import React from "react";
import {
  ComparisonType,
  JourneyType,
  QueryStatementType,
  QueryType,
  SegmentsSettingsType,
  setJourneyType,
  setSegmentsSettings,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FilterBuilder from "./FilterBuilder/FilterBuilder";

const FlowBuilderSegmentEditor = () => {
  const { segments: segmentsSettings, journeyType } = useAppSelector(
    (state) => state.flowBuilder
  );
  const dispatch = useAppDispatch();

  return (
    <div className="m-[20px] max-h-full overflow-y-scroll w-full bg-white rounded-[4px] p-[20px] text-[#111827] font-inter">
      <div className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[16px] leading-[24px]">
            Who can enter this journey
          </div>
          <div className="flex gap-[20px]">
            <div
              className={`w-[390px] px-[20px] py-[10px] flex flex-col gap-[10px] rounded-[4px] select-none cursor-pointer ${
                segmentsSettings.type === SegmentsSettingsType.ALL_CUSTOMERS
                  ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
                  : "border-[1px] border-[#E5E7EB]"
              }`}
              onClick={() =>
                dispatch(
                  setSegmentsSettings({
                    type: SegmentsSettingsType.ALL_CUSTOMERS,
                  })
                )
              }
            >
              <div className="font-semibold text-[16px] leading-[24px]">
                All customers
              </div>
              <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
                Description description description
              </div>
            </div>

            <div
              className={`w-[390px] px-[20px] py-[10px] flex flex-col gap-[10px] rounded-[4px] select-none cursor-pointer ${
                segmentsSettings.type === SegmentsSettingsType.CONDITIONAL
                  ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
                  : "border-[1px] border-[#E5E7EB]"
              }`}
              onClick={() =>
                dispatch(
                  setSegmentsSettings({
                    type: SegmentsSettingsType.CONDITIONAL,
                    query: {
                      type: QueryType.ALL,
                      statements: [
                        {
                          type: QueryStatementType.ATTRIBUTE,
                          key: "",
                          comparisonType: ComparisonType.EQUALS,
                          valueType: StatementValueType.STRING,
                          value: "",
                        },
                      ],
                    },
                  })
                )
              }
            >
              <div className="font-semibold text-[16px] leading-[24px]">
                When customer meets conditions
              </div>
              <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
                Description description description
              </div>
            </div>
          </div>
        </div>

        {segmentsSettings.type === SegmentsSettingsType.CONDITIONAL && (
          <div className="flex flex-col gap-[10px]">
            <div className="font-semibold text-[16px] leading-[24px]">
              Conditions
            </div>
            <FilterBuilder
              settings={segmentsSettings}
              onSettingsChange={(settings) =>
                dispatch(setSegmentsSettings(settings))
              }
            />
          </div>
        )}

        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[16px] leading-[24px]">
            Journey type
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            Dynamic journeys enroll new customers who meet conditions, while
            static journeys only enroll customers who meet conditions at start.
          </div>
          <div className="flex font-roboto font-normal text-[16px] leading-[24px]">
            <div
              className={`px-[16px] py-[8px] select-none cursor-pointer rounded-l-[2px] ${
                journeyType === JourneyType.DYNAMIC
                  ? "bg-[#6366F1] text-white"
                  : "border-[1px] border-[#9CA3AF]"
              }`}
              onClick={() => dispatch(setJourneyType(JourneyType.DYNAMIC))}
            >
              Dynamic journey
            </div>
            <div
              className={`px-[16px] py-[8px] select-none cursor-pointer rounded-r-[2px] ${
                journeyType === JourneyType.STATIC
                  ? "bg-[#6366F1] text-white"
                  : "border-[1px] border-[#9CA3AF]"
              }`}
              onClick={() => dispatch(setJourneyType(JourneyType.STATIC))}
            >
              Static journey
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderSegmentEditor;
