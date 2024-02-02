import Table from "components/Tablev2";
import { format } from "date-fns";
import { capitalize } from "lodash";
import React, { FC, useEffect, useState } from "react";
import {
  EntryTiming,
  EntryTimingSettings,
  JourneyEnrollmentType,
  JourneySettingsMaxMessageSends,
  JourneySettingsMaxUserEntries,
  JourneySettingsQuietFallbackBehavior,
  JourneySettingsQuietHours,
  SegmentsSettings,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";

enum ActivityEventType {
  JOURNEY = "journey",
  ENTRY = "entry",
  SETTINGS = "settings",
}

enum JourneyChange {
  PUBLISH = "publish",
  PAUSE = "pause",
  STOP = "stop",
  DELETE = "delete",
  RESTORE = "restore",
  EDIT_SAVE = "edit-save",
  EDIT_PUBLISH = "edit-publish",
}

enum EntryChange {
  ENTRY_TIMING = "entry-timing",
  ENTRY_TYPE = "entry-type",
  ELIGIBLE_USERS = "eligible-users",
}

enum SettingsChange {
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

type ChangeType = JourneyChange | EntryChange | SettingsChange;

type UndetailedChangeType =
  | JourneyChange.PAUSE
  | JourneyChange.STOP
  | JourneyChange.DELETE
  | JourneyChange.EDIT_SAVE
  | SettingsChange.DISABLE_QUIETE_HOURS
  | SettingsChange.DISABLE_MAX_USER_ENTRIES
  | SettingsChange.DISABLE_MAX_MESSAGE_SENDS;

interface UndetailedChange {
  type: UndetailedChangeType;
}

interface NameDetailedChange {
  type: JourneyChange.PUBLISH | JourneyChange.EDIT_PUBLISH;
  name: string;
}

interface RestoreChange {
  type: JourneyChange.RESTORE;
  name1: string;
  name2: string;
}

interface EntryTimingChange {
  type: EntryChange.ENTRY_TIMING;
  entryTiming: EntryTimingSettings;
}

interface EntryTypeChange {
  type: EntryChange.ENTRY_TYPE;
  entryType: JourneyEnrollmentType;
}

interface EligibleUsersChange {
  type: EntryChange.ELIGIBLE_USERS;
  inclusionCriteria: SegmentsSettings;
}

interface TagChange {
  type: SettingsChange.ADD_TAG | SettingsChange.DELETE_TAG;
  tag: string;
}

interface QuietHoursChange {
  type: SettingsChange.ENABLE_QUIETE_HOURS | SettingsChange.CHANGE_QUIETE_HOURS;
  quietHours: JourneySettingsQuietHours;
}

interface MaxUserEntriesChange {
  type:
    | SettingsChange.ENABLE_MAX_USER_ENTRIES
    | SettingsChange.CHANGE_MAX_USER_ENTRIES;
  maxUserEntries: JourneySettingsMaxUserEntries;
}

interface MaxMessageSendsChange {
  type:
    | SettingsChange.ENABLE_MAX_MESSAGE_SENDS
    | SettingsChange.CHANGE_MAX_MESSAGE_SENDS;
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
  type: ActivityEventType;
  changes: Change[];
}

const generateDetails = (change: Change) => {
  switch (change.type) {
    case JourneyChange.PUBLISH:
      return (
        <>
          Published journey as <b>{change.name}</b>
        </>
      );
    case JourneyChange.PAUSE:
      return <>Paused Journey</>;
    case JourneyChange.STOP:
      return <>Stopped journey</>;
    case JourneyChange.DELETE:
      return <>Deleted journey</>;
    case JourneyChange.RESTORE:
      return (
        <>
          Restore <b>{change.name1}</b>, and published as <b>{change.name2}</b>
        </>
      );
    case JourneyChange.EDIT_SAVE:
      return <>Edit journey, and save as draft</>;
    case JourneyChange.EDIT_PUBLISH:
      return (
        <>
          Edit journey, and published as <b>{change.name}</b>
        </>
      );
    case EntryChange.ENTRY_TIMING:
      return (
        <>
          Change <b>Entry timing</b>: {JSON.stringify(change.entryTiming)}
        </>
      );
    case EntryChange.ENTRY_TYPE:
      return (
        <>
          Change <b>Entry type</b>: {JSON.stringify(change.entryType)}
        </>
      );
    case EntryChange.ELIGIBLE_USERS:
      return (
        <>
          Change <b>Eligible users</b>:{" "}
          {change.inclusionCriteria.type === SegmentsSettingsType.ALL_CUSTOMERS
            ? "All customers"
            : "when customer meets conditions, change the conditions"}
        </>
      );
    case SettingsChange.ADD_TAG:
      return (
        <>
          Add tag: <b>{change.tag}</b>
        </>
      );
    case SettingsChange.DELETE_TAG:
      return (
        <>
          Delete tag: <b>{change.tag}</b>
        </>
      );
    case SettingsChange.ENABLE_QUIETE_HOURS:
      return (
        <>
          Enable <b>Quiet hours</b>: {JSON.stringify(change.quietHours)}
        </>
      );
    case SettingsChange.CHANGE_QUIETE_HOURS:
      return (
        <>
          Change <b>Quiet hours</b>: {JSON.stringify(change.quietHours)}
        </>
      );
    case SettingsChange.DISABLE_QUIETE_HOURS:
      return (
        <>
          Disable <b>Quiet hours</b>
        </>
      );
    case SettingsChange.ENABLE_MAX_USER_ENTRIES:
      return (
        <>
          Enable <b>Max user entries</b>:{" "}
          {JSON.stringify(change.maxUserEntries)}
        </>
      );
    case SettingsChange.CHANGE_MAX_USER_ENTRIES:
      return (
        <>
          Change <b>Max user entries</b>:{" "}
          {JSON.stringify(change.maxUserEntries)}
        </>
      );
    case SettingsChange.DISABLE_MAX_USER_ENTRIES:
      return (
        <>
          Disable <b>Max user entries</b>
        </>
      );
    case SettingsChange.ENABLE_MAX_MESSAGE_SENDS:
      return (
        <>
          Enable <b>Max message sends</b>:{" "}
          {JSON.stringify(change.maxMessageSends)}
        </>
      );
    case SettingsChange.CHANGE_MAX_MESSAGE_SENDS:
      return (
        <>
          Change <b>Max message sends</b>:{" "}
          {JSON.stringify(change.maxMessageSends)}
        </>
      );
    case SettingsChange.DISABLE_MAX_MESSAGE_SENDS:
      return (
        <>
          Disable <b>Max message sends</b>
        </>
      );
    default:
      return <></>;
  }
};

interface ActivityHistoryViewerProps {
  id: string;
}

const ActivityHistoryViewer: FC<ActivityHistoryViewerProps> = ({ id }) => {
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([
    {
      date: new Date().toUTCString(),
      type: ActivityEventType.JOURNEY,
      changes: [
        { type: JourneyChange.PUBLISH, name: "Version 1" },
        {
          type: EntryChange.ENTRY_TYPE,
          entryType: JourneyEnrollmentType.OnlyCurrent,
        },
        {
          type: EntryChange.ELIGIBLE_USERS,
          inclusionCriteria: { type: SegmentsSettingsType.ALL_CUSTOMERS },
        },
        { type: SettingsChange.ADD_TAG, tag: "tagtagtag" },
        { type: SettingsChange.DISABLE_QUIETE_HOURS },
        {
          type: SettingsChange.CHANGE_QUIETE_HOURS,
          quietHours: {
            enabled: true,
            startTime: "time",
            endTime: "time",
            fallbackBehavior:
              JourneySettingsQuietFallbackBehavior.NextAvailableTime,
          },
        },
      ],
    },
  ]);

  const loadChanges = async () => {
    await ApiService.get({ url: `/journeys/${id}/changes` });
  };

  useEffect(() => {
    loadChanges();
  }, [id]);

  return (
    <div className="p-5 w-full">
      <div className="p-5 bg-white rounded-lg">
        <Table
          className="w-full"
          headClassName="bg-[#F3F4F6]"
          rowsData={activityEvents}
          headings={[
            <div className="px-5 py-2.5">Date</div>,
            <div className="px-5 py-2.5">Type</div>,
            <div className="px-5 py-2.5 w-full">Details</div>,
          ]}
          rows={activityEvents.map((activityEvent) => [
            <div>
              {format(new Date(activityEvent.date), "MM/dd/yyyy HH:mm")}
            </div>,
            <div>{capitalize(activityEvent.type)}</div>,
            <div>
              {activityEvent.changes.map((change, i) => (
                <div key={i}>{generateDetails(change)}</div>
              ))}
            </div>,
          ])}
        />
      </div>
    </div>
  );
};

export default ActivityHistoryViewer;
