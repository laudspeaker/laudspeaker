import React from "react";
import {
  EntryTiming,
  EntryTimingFrequency,
  JourneyEnrollmentType,
  JourneySettingsQuietFallbackBehavior,
  JourneyType,
  QueryStatementType,
  QueryType,
  RecurrenceEndsOption,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";
import FilterViewer from "./FilterViewer/FilterViewer";
import FlowEditor from "./FlowEditor";
import { format } from "date-fns";
import JourneyTagsViewer from "./JourneyTagsViewer";
import QuiteHoursViewer from "./QuiteHoursViewer";
import MaxUserEntriesViewer from "./MaxUserEntriesViewer";
import MaxMessageSendsViewer from "./MaxMessageSendsViewer";
import EligibleUsersViewer from "./EligibleUsersViewer";
import EnrollmentTypeViewer from "./EnrollementTypeViewer";
import EntryTimingViewer from "./EntryTimingViewer";

const FlowBuilderReview = () => {
  const {
    segments: segmentsSettings,
    journeyType,
    journeySettings,
    journeyEntrySettings,
  } = useAppSelector((state) => state.flowBuilder);

  return (
    <div className="relative w-full m-5 text-[#111827] font-inter font-normal text-[14px] leading-[22px] overflow-y-scroll">
      <div className="h-full flex flex-col gap-5">
        <div className="relative bg-white h-full p-5 flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-base">Journey</div>
          <div className="min-h-[420px] h-full">
            <FlowEditor isViewMode />
          </div>
        </div>
        <EntryTimingViewer
          entryTimingSettings={journeyEntrySettings.entryTiming}
        />
        <EnrollmentTypeViewer
          enrollmentType={journeyEntrySettings.enrollmentType}
        />
        <EligibleUsersViewer segmentsSettings={segmentsSettings} />
        {journeySettings.tags.length > 0 && (
          <JourneyTagsViewer tags={journeySettings.tags} />
        )}
        <QuiteHoursViewer quietHoursSettings={journeySettings.quietHours} />
        <MaxUserEntriesViewer maxEntriesSettings={journeySettings.maxEntries} />
        <MaxMessageSendsViewer
          maxMessageSendsSettings={journeySettings.maxMessageSends}
        />
      </div>
    </div>
  );
};

export default FlowBuilderReview;
