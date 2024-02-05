import { format } from "date-fns";
import React, { FC } from "react";
import {
  EntryTiming,
  EntryTimingFrequency,
  EntryTimingSettings,
  RecurrenceEndsOption,
} from "reducers/flow-builder.reducer";

export const entryTimingFrequencyToTimeUnitMap: Record<
  EntryTimingFrequency,
  string
> = {
  [EntryTimingFrequency.Once]: "",
  [EntryTimingFrequency.Daily]: "day",
  [EntryTimingFrequency.Weekly]: "week",
  [EntryTimingFrequency.Monthly]: "month",
};

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface EntryTimingViewerProps {
  entryTimingSettings: EntryTimingSettings;
}

const EntryTimingViewer: FC<EntryTimingViewerProps> = ({
  entryTimingSettings,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Entry timing
      </div>
      <div>
        {entryTimingSettings.type === EntryTiming.WhenPublished ? (
          <>Enter users as soon as this journey published</>
        ) : entryTimingSettings.type === EntryTiming.SpecificTime &&
          entryTimingSettings.time ? (
          <>
            {entryTimingSettings.time.frequency ===
            EntryTimingFrequency.Once ? (
              <>
                Enter users from{" "}
                <b>
                  {format(
                    new Date(entryTimingSettings.time.startDate),
                    "MM/dd/yyyy HH:mm"
                  )}
                </b>
              </>
            ) : (
              <>
                <ul className="list-disc pl-5">
                  <li>
                    Enter users{" "}
                    <b>{entryTimingSettings.time.frequency.toLowerCase()}</b>,
                    start from{" "}
                    <b>
                      {format(
                        new Date(entryTimingSettings.time.startDate),
                        "MM/dd/yyyy HH:mm"
                      )}
                    </b>
                  </li>
                  <li>
                    Repeat every{" "}
                    <b>{entryTimingSettings.time.recurrence.repeatEvery}</b>{" "}
                    {
                      entryTimingFrequencyToTimeUnitMap[
                        entryTimingSettings.time.frequency
                      ]
                    }{" "}
                    (s){" "}
                    {entryTimingSettings.time.frequency ===
                    EntryTimingFrequency.Weekly ? (
                      <>
                        on{" "}
                        <b>
                          {entryTimingSettings.time.recurrence.weeklyOn
                            .map((item, i) => (item === 1 ? weekDays[i] : ""))
                            .filter((item) => item)
                            .join(", ")}
                        </b>
                      </>
                    ) : (
                      <></>
                    )}
                  </li>
                  <li>
                    {entryTimingSettings.time.recurrence.endsOn ===
                    RecurrenceEndsOption.Never ? (
                      <>Never ends</>
                    ) : entryTimingSettings.time.recurrence.endsOn ===
                      RecurrenceEndsOption.After ? (
                      <>
                        End after{" "}
                        <b>
                          {
                            entryTimingSettings.time.recurrence
                              .endAdditionalValue
                          }
                        </b>{" "}
                        occurence(s)
                      </>
                    ) : entryTimingSettings.time.recurrence.endsOn ===
                      RecurrenceEndsOption.SpecificDate ? (
                      <>
                        Ends at{" "}
                        <b>
                          {format(
                            new Date(
                              entryTimingSettings.time.recurrence
                                .endAdditionalValue as string
                            ),
                            "MM/dd/yyyy HH:mm"
                          )}
                        </b>
                      </>
                    ) : (
                      <></>
                    )}
                  </li>
                  {entryTimingSettings.time.userLocalTimeZone ? (
                    <li>Enter users in their time zone</li>
                  ) : (
                    <></>
                  )}
                </ul>
              </>
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default EntryTimingViewer;
