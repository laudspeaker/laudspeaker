import React from "react";
import {
  EntryTiming,
  EntryTimingFrequency,
  JourneyEnrollmentType,
  JourneySettingsQuietFallbackBehavior,
  JourneyType,
  QueryStatementType,
  QueryType,
  RecurrenceEndsOptions,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";
import FilterViewer from "./FilterViewer/FilterViewer";
import FlowEditor from "./FlowEditor";
import { format } from "date-fns";

const entryTimingFrequencyToTimeUnitMap: Record<EntryTimingFrequency, string> =
  {
    [EntryTimingFrequency.Once]: "",
    [EntryTimingFrequency.Daily]: "day",
    [EntryTimingFrequency.Weekly]: "week",
    [EntryTimingFrequency.Monthly]: "month",
  };

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

        <div className="p-5 flex flex-col gap-2.5 bg-white">
          <div className="text-[16px] font-semibold leading-[24px]">
            Entry timing
          </div>
          <div>
            {journeyEntrySettings.entryTiming.type ===
            EntryTiming.WhenPublished ? (
              <>Enter users as soon as this journey published</>
            ) : journeyEntrySettings.entryTiming.type ===
                EntryTiming.SpecificTime &&
              journeyEntrySettings.entryTiming.time ? (
              <>
                {journeyEntrySettings.entryTiming.time.frequency ===
                EntryTimingFrequency.Once ? (
                  <>
                    Enter users from{" "}
                    <b>
                      {format(
                        new Date(
                          journeyEntrySettings.entryTiming.time.startDate
                        ),
                        "MM/dd/yyyy HH:mm"
                      )}
                    </b>
                  </>
                ) : (
                  <>
                    <ul className="list-disc pl-5">
                      <li>
                        Enter users{" "}
                        <b>
                          {journeyEntrySettings.entryTiming.time.frequency.toLowerCase()}
                        </b>
                        , start from{" "}
                        <b>
                          {format(
                            new Date(
                              journeyEntrySettings.entryTiming.time.startDate
                            ),
                            "MM/dd/yyyy HH:mm"
                          )}
                        </b>
                      </li>
                      <li>
                        Repeat every{" "}
                        <b>
                          {
                            journeyEntrySettings.entryTiming.time.recurrence
                              .repeatEvery
                          }
                        </b>{" "}
                        {
                          entryTimingFrequencyToTimeUnitMap[
                            journeyEntrySettings.entryTiming.time.frequency
                          ]
                        }{" "}
                        (s){" "}
                        {journeyEntrySettings.entryTiming.time.frequency ===
                        EntryTimingFrequency.Weekly ? (
                          <>
                            on{" "}
                            <b>
                              {journeyEntrySettings.entryTiming.time.recurrence.weeklyOn
                                .map((item, i) =>
                                  item === 1 ? weekDays[i] : ""
                                )
                                .filter((item) => item)
                                .join(", ")}
                            </b>
                          </>
                        ) : (
                          <></>
                        )}
                      </li>
                      <li>
                        {journeyEntrySettings.entryTiming.time.recurrence
                          .endsOn === RecurrenceEndsOptions.Never ? (
                          <>Never ends</>
                        ) : journeyEntrySettings.entryTiming.time.recurrence
                            .endsOn === RecurrenceEndsOptions.After ? (
                          <>
                            End after{" "}
                            <b>
                              {
                                journeyEntrySettings.entryTiming.time.recurrence
                                  .endAdditionalValue
                              }
                            </b>{" "}
                            occurence(s)
                          </>
                        ) : journeyEntrySettings.entryTiming.time.recurrence
                            .endsOn === RecurrenceEndsOptions.SpecificDate ? (
                          <>
                            Ends at{" "}
                            <b>
                              {format(
                                new Date(
                                  journeyEntrySettings.entryTiming.time
                                    .recurrence.endAdditionalValue as string
                                ),
                                "MM/dd/yyyy HH:mm"
                              )}
                            </b>
                          </>
                        ) : (
                          <></>
                        )}
                      </li>
                      {journeyEntrySettings.entryTiming.time
                        .userLocalTimeZone ? (
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

        <div className="p-5 flex flex-col gap-2.5 bg-white">
          <div className="text-[16px] font-semibold leading-[24px]">
            Enrollment type
          </div>
          <div>
            {journeyEntrySettings.enrollmentType ===
            JourneyEnrollmentType.CurrentAndFutureUsers ? (
              <>Enroll current users and future matching users</>
            ) : journeyEntrySettings.enrollmentType ===
              JourneyEnrollmentType.OnlyCurrent ? (
              <>
                Only enroll <b>current</b> users
              </>
            ) : journeyEntrySettings.enrollmentType ===
              JourneyEnrollmentType.OnlyFuture ? (
              <>
                Only enroll <b>future</b> matching users
              </>
            ) : (
              <></>
            )}
          </div>
        </div>

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

        {journeySettings.tags.length > 0 && (
          <div className="p-5 flex flex-col gap-2.5 bg-white">
            <div className="text-[16px] font-semibold leading-[24px]">
              Journey tags
            </div>
            <div className="flex gap-2.5">
              {journeySettings.tags.map((tag, i) => (
                <div
                  key={i}
                  className="py-[2px] pl-[8px] pr-[4px] font-roboto text-[12px] leading-[20px] bg-[#E5E7EB] border border-[#E5E7EB] rounded-sm"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 flex flex-col gap-2.5 bg-white">
          <div className="text-[16px] font-semibold leading-[24px]">
            Quiet hours
          </div>
          <div>
            {journeySettings.quietHours.enabled ? (
              <ul className="list-disc pl-5">
                <li>
                  Start from {journeySettings.quietHours.startTime} to{" "}
                  {journeySettings.quietHours.endTime}
                </li>
                <li>
                  Fallback behavior:{" "}
                  {journeySettings.quietHours.fallbackBehavior ===
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

        <div className="p-5 flex flex-col gap-2.5 bg-white">
          <div className="text-[16px] font-semibold leading-[24px]">
            Max user entries
          </div>
          <div>
            {journeySettings.maxEntries.enabled ? (
              <>
                Limit max users who will receive messages:{" "}
                <b>{journeySettings.maxEntries.maxEntries}</b> users
              </>
            ) : (
              <>No limitation</>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col gap-2.5 bg-white">
          <div className="text-[16px] font-semibold leading-[24px]">
            Max message sends
          </div>
          <div>
            {journeySettings.maxMessageSends.maxSendRate && (
              <div>
                Limit max users who will receive message to:{" "}
                <b>{journeySettings.maxMessageSends.maxSendRate}</b> users
              </div>
            )}
            {journeySettings.maxMessageSends.maxUsersReceive && (
              <div>
                Limit the sending rate:{" "}
                <b>{journeySettings.maxMessageSends.maxUsersReceive}</b>{" "}
                messages per minute
              </div>
            )}
            {!journeySettings.maxMessageSends.maxSendRate &&
              !journeySettings.maxMessageSends.maxUsersReceive && (
                <>No limitation</>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderReview;
