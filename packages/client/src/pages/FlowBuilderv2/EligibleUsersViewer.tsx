import React, { FC } from "react";
import {
  SegmentsSettings,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import FilterViewer from "./FilterViewer/FilterViewer";

interface EligibleUsersViewerProps {
  segmentsSettings: SegmentsSettings;
}

const EligibleUsersViewer: FC<EligibleUsersViewerProps> = ({
  segmentsSettings,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Eligible users
      </div>
      <div>
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
  );
};

export default EligibleUsersViewer;
