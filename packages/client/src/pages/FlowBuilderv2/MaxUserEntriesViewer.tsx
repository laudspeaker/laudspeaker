import React, { FC } from "react";
import { JourneySettingsMaxUserEntries } from "reducers/flow-builder.reducer";

interface MaxUserEntriesViewerProps {
  maxEntriesSettings: JourneySettingsMaxUserEntries;
}

const MaxUserEntriesViewer: FC<MaxUserEntriesViewerProps> = ({
  maxEntriesSettings,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Max user entries
      </div>
      <div>
        {maxEntriesSettings.enabled ? (
          <>
            Limit max users who will receive messages:{" "}
            <b>{maxEntriesSettings.maxEntries}</b> users
          </>
        ) : (
          <>No limitation</>
        )}
      </div>
    </div>
  );
};

export default MaxUserEntriesViewer;
