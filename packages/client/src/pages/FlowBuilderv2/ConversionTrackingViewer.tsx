import React, { FC } from "react";
import {
  JourneySettingsQuietFallbackBehavior,
  JourneySettingsQuietHours,
  JourneySettingsConversionTracking,
} from "reducers/flow-builder.reducer";

interface ConversionTrackingViewerProps {
  conversionTrackingSettings: JourneySettingsConversionTracking;
}

const ConversionTrackingViewer: FC<ConversionTrackingViewerProps> = ({
  conversionTrackingSettings,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Conversion Tracking
      </div>
      <div>
        {conversionTrackingSettings.enabled ? (
          <ul className="list-disc pl-5">
            <li>
              Events to track: {conversionTrackingSettings.events.join(", ")}
            </li>
            <li>
              Conversion deadline:
              {conversionTrackingSettings.timeLimit?.value}{" "}
              {conversionTrackingSettings.timeLimit?.unit}
            </li>
          </ul>
        ) : (
          <>No conversion tracking</>
        )}
      </div>
    </div>
  );
};

export default ConversionTrackingViewer;
