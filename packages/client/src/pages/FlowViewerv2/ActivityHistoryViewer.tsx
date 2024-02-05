import { AxiosError } from "axios";
import Pagination from "components/Pagination";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { capitalize } from "lodash";
import {
  entryTimingFrequencyToTimeUnitMap,
  weekDays,
} from "pages/FlowBuilderv2/EntryTimingViewer";
import React, { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  EntryTiming,
  EntryTimingFrequency,
  EntryTimingSettings,
  JourneyEnrollmentType,
  JourneyEntrySettings,
  JourneySettingsMaxMessageSends,
  JourneySettingsMaxUserEntries,
  JourneySettingsQuietFallbackBehavior,
  JourneySettingsQuietHours,
  RecurrenceEndsOption,
  SegmentsSettings,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";

enum ActivityEventType {
  JOURNEY = "journey",
  ENTRY = "entry",
  SETTINGS = "settings",
}

enum JourneyChangeType {
  PUBLISH = "publish",
  PAUSE = "pause",
  RESUME = "resume",
  STOP = "stop",
  DELETE = "delete",
  RESTORE = "restore",
  EDIT_SAVE = "edit-save",
  EDIT_PUBLISH = "edit-publish",
}

enum EntryChangeType {
  ENTRY_TIMING = "entry-timing",
  ENTRY_TYPE = "entry-type",
  ELIGIBLE_USERS = "eligible-users",
}

enum SettingsChangeType {
  ADD_TAG = "add-tag",
  DELETE_TAG = "delete-tag",
  ENABLE_QUIETE_HOURS = "enable-qh",
  CHANGE_QUIETE_HOURS = "change-qh",
  DISABLE_QUIETE_HOURS = "disable-qh",
  ENABLE_MAX_USER_ENTRIES = "enable-max-user",
  CHANGE_MAX_USER_ENTRIES = "change-max-user",
  DISABLE_MAX_USER_ENTRIES = "disable-max-user",
  ENABLE_MAX_MESSAGE_SENDS = "enable-max-message",
  CHANGE_MAX_MESSAGE_SENDS = "change-max-message",
  DISABLE_MAX_MESSAGE_SENDS = "disable-max-message",
}

type ChangeType = JourneyChangeType | EntryChangeType | SettingsChangeType;

type UndetailedChangeType =
  | JourneyChangeType.PAUSE
  | JourneyChangeType.RESUME
  | JourneyChangeType.STOP
  | JourneyChangeType.DELETE
  | JourneyChangeType.EDIT_SAVE
  | SettingsChangeType.DISABLE_QUIETE_HOURS
  | SettingsChangeType.DISABLE_MAX_USER_ENTRIES
  | SettingsChangeType.DISABLE_MAX_MESSAGE_SENDS;

interface UndetailedChange {
  type: UndetailedChangeType;
}

interface NameDetailedChange {
  type: JourneyChangeType.PUBLISH | JourneyChangeType.EDIT_PUBLISH;
  name: string;
}

interface RestoreChange {
  type: JourneyChangeType.RESTORE;
  name1: string;
  name2: string;
}

interface EntryTimingChange {
  type: EntryChangeType.ENTRY_TIMING;
  entryTiming: EntryTimingSettings;
}

interface EntryTypeChange {
  type: EntryChangeType.ENTRY_TYPE;
  entryType: JourneyEnrollmentType;
}

interface EligibleUsersChange {
  type: EntryChangeType.ELIGIBLE_USERS;
  inclusionCriteria: SegmentsSettings;
}

interface TagChange {
  type: SettingsChangeType.ADD_TAG | SettingsChangeType.DELETE_TAG;
  tag: string;
}

interface QuietHoursChange {
  type:
    | SettingsChangeType.ENABLE_QUIETE_HOURS
    | SettingsChangeType.CHANGE_QUIETE_HOURS;
  quietHours: JourneySettingsQuietHours;
}

interface MaxUserEntriesChange {
  type:
    | SettingsChangeType.ENABLE_MAX_USER_ENTRIES
    | SettingsChangeType.CHANGE_MAX_USER_ENTRIES;
  maxUserEntries: JourneySettingsMaxUserEntries;
}

interface MaxMessageSendsChange {
  type:
    | SettingsChangeType.ENABLE_MAX_MESSAGE_SENDS
    | SettingsChangeType.CHANGE_MAX_MESSAGE_SENDS;
  maxMessageSends: JourneySettingsMaxMessageSends;
}

type Change =
  | UndetailedChange
  | NameDetailedChange
  | RestoreChange
  | EntryTimingChange
  | EntryTypeChange
  | EligibleUsersChange
  | TagChange
  | QuietHoursChange
  | MaxUserEntriesChange
  | MaxMessageSendsChange;

interface ActivityEvent {
  date: string;
  changerEmail: string;
  type: ActivityEventType;
  changes: Change[];
}

const generateQuietHoursHumanReadableDetails = (
  quietHoursSettings: JourneySettingsQuietHours
) => (
  <>
    {quietHoursSettings.startTime} - {quietHoursSettings.endTime},{" "}
    {quietHoursSettings.fallbackBehavior ===
    JourneySettingsQuietFallbackBehavior.NextAvailableTime
      ? "send at next available time"
      : "abort message"}
  </>
);

const generateMaxUserEntriesHumanReadableDetails = (
  maxEntriesSettings: JourneySettingsMaxUserEntries
) => (
  <>
    {maxEntriesSettings.maxEntries}{" "}
    {maxEntriesSettings.limitOnEverySchedule
      ? ", limit every time the journey is scheduled"
      : ""}
  </>
);

const generateMaxMessageSendsHumanReadableDetails = (
  maxMessageSendsSettings: JourneySettingsMaxMessageSends
) => (
  <>
    Limit max users who will receive messages,{" "}
    {maxMessageSendsSettings.maxUsersReceive || "unlimited"} users. Limit the
    sending rate, {maxMessageSendsSettings.maxSendRate || "unlimited"} messages
    per minute
  </>
);

const generateEnrollmentTypeHumanReadableDetails = (
  enrollmentType: JourneyEnrollmentType
) => (
  <>
    {enrollmentType === JourneyEnrollmentType.OnlyCurrent ? (
      <>
        Only enroll <b>current</b> users
      </>
    ) : enrollmentType === JourneyEnrollmentType.OnlyFuture ? (
      <>
        Only enroll <b>future</b> matching users
      </>
    ) : (
      <>Enroll current users and future matching users</>
    )}
  </>
);

const generateEntryTimingHumanReadableDetails = (
  entryTimingSettings: EntryTimingSettings
) => (
  <>
    {entryTimingSettings.type === EntryTiming.WhenPublished ||
    !entryTimingSettings.time ? (
      <>Enter users as soon as this journey published</>
    ) : (
      <>
        Enter users at specific time,{" "}
        {format(
          new Date(entryTimingSettings.time.startDate),
          "MM/dd/yyyy HH:mm"
        )}
        , {entryTimingSettings.time.frequency.toLowerCase()}
        {entryTimingSettings.time.frequency !== EntryTimingFrequency.Once && (
          <>
            , repeat every {entryTimingSettings.time.recurrence.repeatEvery}{" "}
            {
              entryTimingFrequencyToTimeUnitMap[
                entryTimingSettings.time.frequency
              ]
            }
            (s)
            {entryTimingSettings.time.frequency ===
            EntryTimingFrequency.Weekly ? (
              <>
                {" "}
                on{" "}
                {entryTimingSettings.time.recurrence.weeklyOn
                  .map((weekDaySignal, i) =>
                    weekDaySignal === 1 ? weekDays[i] : ""
                  )
                  .filter((item) => !!item)
                  .join(", ")}
              </>
            ) : (
              <></>
            )}
            {entryTimingSettings.time.recurrence.endsOn ===
            RecurrenceEndsOption.Never ? (
              <></>
            ) : entryTimingSettings.time.recurrence.endsOn ===
              RecurrenceEndsOption.After ? (
              <>
                , ends after{" "}
                <b>{entryTimingSettings.time.recurrence.endAdditionalValue}</b>{" "}
                occurence(s)
              </>
            ) : entryTimingSettings.time.recurrence.endsOn ===
              RecurrenceEndsOption.SpecificDate ? (
              <>
                , ends at{" "}
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
          </>
        )}
        {entryTimingSettings.time.userLocalTimeZone
          ? ",enter users in their local time zone"
          : ""}
      </>
    )}
  </>
);

const generateDetails = (change: Change) => {
  switch (change.type) {
    case JourneyChangeType.PUBLISH:
      return (
        <>
          Published journey as <b>{change.name}</b>
        </>
      );
    case JourneyChangeType.PAUSE:
      return <>Paused Journey</>;
    case JourneyChangeType.RESUME:
      return <>Resumed journey</>;
    case JourneyChangeType.STOP:
      return <>Stopped journey</>;
    case JourneyChangeType.DELETE:
      return <>Deleted journey</>;
    case JourneyChangeType.RESTORE:
      return (
        <>
          Restore <b>{change.name1}</b>, and published as <b>{change.name2}</b>
        </>
      );
    case JourneyChangeType.EDIT_SAVE:
      return <>Edit journey, and save as draft</>;
    case JourneyChangeType.EDIT_PUBLISH:
      return (
        <>
          Edit journey, and published as <b>{change.name}</b>
        </>
      );
    case EntryChangeType.ENTRY_TIMING:
      return (
        <>
          Change <b>Entry timing</b>:{" "}
          {generateEntryTimingHumanReadableDetails(change.entryTiming)}
        </>
      );
    case EntryChangeType.ENTRY_TYPE:
      return (
        <>
          Change <b>Entry type</b>:{" "}
          {generateEnrollmentTypeHumanReadableDetails(change.entryType)}
        </>
      );
    case EntryChangeType.ELIGIBLE_USERS:
      return (
        <>
          Change <b>Eligible users</b>:{" "}
          {change.inclusionCriteria.type === SegmentsSettingsType.ALL_CUSTOMERS
            ? "All customers"
            : "when customer meets conditions, change the conditions"}
        </>
      );
    case SettingsChangeType.ADD_TAG:
      return (
        <>
          Add tag: <b>{change.tag}</b>
        </>
      );
    case SettingsChangeType.DELETE_TAG:
      return (
        <>
          Delete tag: <b>{change.tag}</b>
        </>
      );
    case SettingsChangeType.ENABLE_QUIETE_HOURS:
      return (
        <>
          Enable <b>Quiet hours</b>:{" "}
          {generateQuietHoursHumanReadableDetails(change.quietHours)}
        </>
      );
    case SettingsChangeType.CHANGE_QUIETE_HOURS:
      return (
        <>
          Change <b>Quiet hours</b>:{" "}
          {generateQuietHoursHumanReadableDetails(change.quietHours)}
        </>
      );
    case SettingsChangeType.DISABLE_QUIETE_HOURS:
      return (
        <>
          Disable <b>Quiet hours</b>
        </>
      );
    case SettingsChangeType.ENABLE_MAX_USER_ENTRIES:
      return (
        <>
          Enable <b>Max user entries</b>:{" "}
          {generateMaxUserEntriesHumanReadableDetails(change.maxUserEntries)}
        </>
      );
    case SettingsChangeType.CHANGE_MAX_USER_ENTRIES:
      return (
        <>
          Change <b>Max user entries</b>:{" "}
          {generateMaxUserEntriesHumanReadableDetails(change.maxUserEntries)}
        </>
      );
    case SettingsChangeType.DISABLE_MAX_USER_ENTRIES:
      return (
        <>
          Disable <b>Max user entries</b>
        </>
      );
    case SettingsChangeType.ENABLE_MAX_MESSAGE_SENDS:
      return (
        <>
          Enable <b>Max message sends</b>:{" "}
          {generateMaxMessageSendsHumanReadableDetails(change.maxMessageSends)}
        </>
      );
    case SettingsChangeType.CHANGE_MAX_MESSAGE_SENDS:
      return (
        <>
          Change <b>Max message sends</b>:{" "}
          {generateMaxMessageSendsHumanReadableDetails(change.maxMessageSends)}
        </>
      );
    case SettingsChangeType.DISABLE_MAX_MESSAGE_SENDS:
      return (
        <>
          Disable <b>Max message sends</b>
        </>
      );
    default:
      return <></>;
  }
};

const ITEMS_PER_PAGE = 10;

interface ActivityHistoryViewerProps {
  id: string;
}

const ActivityHistoryViewer: FC<ActivityHistoryViewerProps> = ({ id }) => {
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadChanges = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<{
        activityEvents: ActivityEvent[];
        totalPages: number;
      }>({
        url: `/journeys/${id}/changes?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }`,
      });

      setActivityEvents(data.activityEvents);
      setTotalPages(data.totalPages);
    } catch (e) {
      if (e instanceof AxiosError) {
        toast.error(
          e.response?.data?.message?.[0] || e.response?.data?.message
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, [id, ITEMS_PER_PAGE, currentPage]);

  return (
    <div className="p-5 w-full">
      <div className="p-5 bg-white rounded-lg">
        <Table
          className="w-full"
          headClassName="bg-[#F3F4F6]"
          isLoading={isLoading}
          rowsData={activityEvents}
          headings={[
            <div className="px-5 py-2.5">Date</div>,
            <div className="px-5 py-2.5">Changer</div>,
            <div className="px-5 py-2.5">Type</div>,
            <div className="px-5 py-2.5 w-full">Details</div>,
          ]}
          rows={activityEvents.map((activityEvent) => [
            <div>
              {format(new Date(activityEvent.date), "MM/dd/yyyy HH:mm")}
            </div>,
            <div>{activityEvent.changerEmail}</div>,
            <div>{capitalize(activityEvent.type)}</div>,
            <div>
              {activityEvent.changes.map((change, i) => (
                <div key={i}>{generateDetails(change)}</div>
              ))}
            </div>,
          ])}
        />
        {totalPages > 1 && (
          <div className="mt-2.5 flex items-center justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistoryViewer;
