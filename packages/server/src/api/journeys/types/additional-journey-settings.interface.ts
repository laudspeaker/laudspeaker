export enum EntryTiming {
  WhenPublished = 'WhenPublished',
  SpecificTime = 'SpecificTime',
}

export enum EntryTimingFrequency {
  Once = 'Once',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export enum RecurrenceEndsOptions {
  Never = 'Never',
  After = 'After',
  SpecificDate = 'SpecificDate',
}

export interface EntryTimingRecurrence {
  repeatEvery: number;
  endsOn: RecurrenceEndsOptions;
  endAdditionalValue?: number | string; // string as Date
  weeklyOn: number[]; // Day of week number
}

export interface EntryTimingSpecificTime {
  startDate: string;
  frequency: EntryTimingFrequency;
  recurrence: EntryTimingRecurrence;
  userLocalTimeZone: boolean;
}

export enum JourneyEnrollmentType {
  CurrentAndFutureUsers = 'CurrentAndFutureUsers',
  OnlyCurrent = 'OnlyCurrent',
  OnlyFuture = 'OnlyFuture',
}

export interface JourneyEntrySettings {
  entryTiming: {
    type: EntryTiming;
    time?: EntryTimingSpecificTime;
  };
  enrollmentType: JourneyEnrollmentType;
}

export enum JourneySettingsQuiteFallbackBehavior {
  NextAvailableTime = 'NextAvailableTime',
  Abort = 'Abort',
}

export interface JourneySettingsQuiteHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  fallbackBehavior: JourneySettingsQuiteFallbackBehavior;
}

export enum MaxOptions {
  Ten = '10',
  Fifty = '50',
  OneHundred = '100',
  FiveHundred = '500',
  OneThousand = '1000',
  FiveThousand = '5000',
  TenThousand = '10000',
  TwentyFiveThousand = '25000',
  FiftyThousand = '50000',
  OneHundredThousand = '100000',
  TwoHundredFiftyThousand = '250000',
  FiveHundredThousand = '500000',
}

export interface JourneySettingsMaxUserEntries {
  enabled: boolean;
  maxEntries: MaxOptions;
  limitOnEverySchedule: boolean;
}

export interface JourneySettingsMaxMessageSends {
  enabled: boolean;
  maxUsersReceive?: MaxOptions;
  maxSendRate?: MaxOptions;
}

export interface JourneySettings {
  tags: string[];
  quiteHours: JourneySettingsQuiteHours;
  maxEntries: JourneySettingsMaxUserEntries;
  maxMessageSends: JourneySettingsMaxMessageSends;
}

