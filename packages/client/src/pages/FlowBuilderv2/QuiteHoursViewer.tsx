import React, { FC } from "react";
import {
  JourneySettingsQuietFallbackBehavior,
  JourneySettingsQuietHours,
} from "reducers/flow-builder.reducer";

interface QuiteHoursViewerProps {
  quietHoursSettings: JourneySettingsQuietHours;
}

const QuiteHoursViewer: FC<QuiteHoursViewerProps> = ({
  quietHoursSettings,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Quiet hours
      </div>
      <div>
        {quietHoursSettings.enabled ? (
          <ul className="list-disc pl-5">
            <li>
              Start from {quietHoursSettings.startTime} to{" "}
              {quietHoursSettings.endTime}
            </li>
            <li>
              Fallback behavior:{" "}
              {quietHoursSettings.fallbackBehavior ===
              JourneySettingsQuietFallbackBehavior.NextAvailableTime ? (
                <>Send at next available time</>
              ) : (
                <>Abort message</>
              )}
            </li>
          </ul>
        ) : (
          <>No quiet hours</>
        )}
      </div>
    </div>
  );
};

export default QuiteHoursViewer;
