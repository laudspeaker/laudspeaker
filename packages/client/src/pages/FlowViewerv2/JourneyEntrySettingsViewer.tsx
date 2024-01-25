import EligibleUsersViewer from "pages/FlowBuilderv2/EligibleUsersViewer";
import EnrollmentTypeViewer from "pages/FlowBuilderv2/EnrollementTypeViewer";
import EntryTimingViewer from "pages/FlowBuilderv2/EntryTimingViewer";
import React, { FC } from "react";
import {
  JourneyEntrySettings,
  SegmentsSettings,
} from "reducers/flow-builder.reducer";

interface JourneyEntrySettingsViewerProps {
  journeyEntrySettings: JourneyEntrySettings;
  segmentsSettings: SegmentsSettings;
}

const JourneyEntrySettingsViewer: FC<JourneyEntrySettingsViewerProps> = ({
  journeyEntrySettings,
  segmentsSettings,
}) => {
  return (
    <div className="p-5 w-full">
      <div className="border-b border-[#E5E7EB]">
        <EntryTimingViewer
          entryTimingSettings={journeyEntrySettings.entryTiming}
        />
      </div>
      <div className="border-b border-[#E5E7EB]">
        <EnrollmentTypeViewer
          enrollmentType={journeyEntrySettings.enrollmentType}
        />
      </div>
      <EligibleUsersViewer segmentsSettings={segmentsSettings} />
    </div>
  );
};

export default JourneyEntrySettingsViewer;
