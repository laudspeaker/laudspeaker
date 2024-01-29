import JourneyTagsViewer from "pages/FlowBuilderv2/JourneyTagsViewer";
import MaxMessageSendsViewer from "pages/FlowBuilderv2/MaxMessageSendsViewer";
import MaxUserEntriesViewer from "pages/FlowBuilderv2/MaxUserEntriesViewer";
import QuiteHoursViewer from "pages/FlowBuilderv2/QuiteHoursViewer";
import React, { FC } from "react";
import { JourneySettings } from "reducers/flow-builder.reducer";

interface JourneySettingsViewerProps {
  journeySettings: JourneySettings;
}

const JourneySettingsViewer: FC<JourneySettingsViewerProps> = ({
  journeySettings,
}) => {
  return (
    <div className="p-5 w-full">
      {journeySettings.tags.length > 0 && (
        <div className="border-b border-[#E5E7EB]">
          <JourneyTagsViewer tags={journeySettings.tags} />
        </div>
      )}
      <div className="border-b border-[#E5E7EB]">
        <QuiteHoursViewer quietHoursSettings={journeySettings.quietHours} />
      </div>
      <div className="border-b border-[#E5E7EB]">
        <MaxUserEntriesViewer maxEntriesSettings={journeySettings.maxEntries} />
      </div>
      <MaxMessageSendsViewer
        maxMessageSendsSettings={journeySettings.maxMessageSends}
      />
    </div>
  );
};

export default JourneySettingsViewer;
