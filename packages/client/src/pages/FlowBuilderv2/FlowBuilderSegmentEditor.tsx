import { RadioGroup } from "@headlessui/react";
import CheckBox from "components/Checkbox/Checkbox";
import RadioOption from "components/Radio/RadioOption";
import {
  addDays,
  format,
  isBefore,
  setDate,
  setHours,
  setMilliseconds,
  setMinutes,
  setMonth,
  setSeconds,
  setYear,
} from "date-fns";
import {
  ComparisonType,
  ConditionalSegmentsSettings,
  DateComparisonType,
  EntryTiming,
  EntryTimingFrequency,
  JourneyEnrollmentType,
  JourneyType,
  ObjectKeyComparisonType,
  QueryStatementType,
  QueryType,
  RecurrenceEndsOption,
  SegmentsSettingsType,
  setJourneyEntryEnrollmentType,
  setJourneyEntryTimingTime,
  setJourneyEntryTimingType,
  setJourneyType,
  setSegmentsSettings,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DateComponent } from "./Elements/DynamicInput";
import FilterBuilder from "./FilterBuilder/FilterBuilder";
import { FC } from "react";
import Button, { ButtonType } from "components/Elements/Buttonv2";

const enrollmentTypes = [
  {
    type: JourneyEnrollmentType.CurrentAndFutureUsers,
    label: "Enroll current users and future matching users",
    desc: "Users that currently exist in the Laudspeaker database, as well as those users that will be created in the future after the journey begins",
  },
  {
    type: JourneyEnrollmentType.OnlyCurrent,
    label: (
      <>
        Only enroll <b>current</b> users
      </>
    ),
    desc: "Only users that currently exist in the Laudspeaker database",
  },
  {
    type: JourneyEnrollmentType.OnlyFuture,
    label: (
      <>
        Only enroll <b>future</b> matching users
      </>
    ),
    desc: "Only users that do currently exist in the Laudspeaker database, and are created after the journey begins",
  },
];

interface FlowBuilderSegmentEditorProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const FlowBuilderSegmentEditor: FC<FlowBuilderSegmentEditorProps> = ({
  onCancel,
  onSave,
}) => {
  const {
    segments: segmentsSettings,
    journeyType,
    journeyEntrySettings,
  } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  if (!journeyEntrySettings) return <></>;

  return (
    <div className="m-5 max-h-full overflow-y-scroll w-full bg-white rounded p-5 text-[#111827] font-inter">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-base">Entry Timing</div>
          <RadioGroup
            value={journeyEntrySettings.entryTiming.type}
            onChange={(el) => dispatch(setJourneyEntryTimingType(el))}
          >
            <RadioOption
              value={EntryTiming.WhenPublished}
              radioText="Enter users as soon as this journey published"
              className="mb-[10px]"
            />
            <RadioOption
              value={EntryTiming.SpecificTime}
              radioText="Enter users at specific time"
            />
          </RadioGroup>
          {journeyEntrySettings.entryTiming.type === EntryTiming.SpecificTime &&
            journeyEntrySettings.entryTiming.time !== undefined && (
              <div className="border-[#E5E7EB] border bg-[#F3F4F6] max-w-[800px] p-[10px] rounded">
                <div className="flex w-full gap-5">
                  <div className="flex flex-col w-full">
                    <div className="text-[#111827] font-inter text-[14px] leading-[22px] mb-[5px] font-semibold">
                      Start Date and Time
                    </div>
                    <div>
                      <DateComponent
                        value={journeyEntrySettings.entryTiming.time.startDate}
                        onChange={(date) => {
                          dispatch(
                            setJourneyEntryTimingTime({
                              ...journeyEntrySettings.entryTiming.time!,
                              startDate: new Date(date).toISOString(), // Assuming 'date' is in the correct ISO format
                            })
                          );
                          dispatch(
                            setJourneyEntryTimingTime({
                              ...journeyEntrySettings.entryTiming.time!,
                              startDate: new Date(date).toISOString(),
                            })
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="text-[#111827] font-inter text-[14px] leading-[22px] mb-[5px] font-semibold">
                      Frequency
                    </div>
                    <div>
                      <select
                        value={journeyEntrySettings.entryTiming.time.frequency}
                        onChange={(ev) =>
                          dispatch(
                            setJourneyEntryTimingTime({
                              ...journeyEntrySettings.entryTiming.time!,
                              frequency: ev.target
                                .value as EntryTimingFrequency,
                            })
                          )
                        }
                        className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
                      >
                        {Object.values(EntryTimingFrequency).map((freq, i) => (
                          <option key={freq} value={freq}>
                            {freq}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {journeyEntrySettings.entryTiming.time.frequency !==
                  EntryTimingFrequency.Once && (
                  <>
                    <div className="flex flex-col gap-[10px] mt-[20px]">
                      <div className="leading-[22px] text-[14px] font-semibold font-inter">
                        Recurrence
                      </div>
                      <div className="flex items-center gap-[10px]">
                        <span className="text-[#111827] font-inter leading-[22px] text-[14px]">
                          Repeat every
                        </span>
                        <input
                          type="number"
                          placeholder="value"
                          value={
                            journeyEntrySettings.entryTiming.time.recurrence
                              .repeatEvery
                          }
                          onChange={(e) => {
                            dispatch(
                              setJourneyEntryTimingTime({
                                ...journeyEntrySettings.entryTiming.time!,
                                recurrence: {
                                  ...journeyEntrySettings.entryTiming.time!
                                    .recurrence,
                                  repeatEvery:
                                    +e.target.value < 1 ? 1 : +e.target.value,
                                },
                              })
                            );
                          }}
                          className="w-full max-w-[134px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
                        />
                        <span className="text-[#111827] font-inter leading-[22px] text-[14px]">
                          {journeyEntrySettings.entryTiming.time.frequency ===
                          EntryTimingFrequency.Daily
                            ? "day (s)"
                            : journeyEntrySettings.entryTiming.time
                                .frequency === EntryTimingFrequency.Monthly
                            ? "month (s)"
                            : "week (s) on"}
                        </span>
                        {journeyEntrySettings.entryTiming.time.frequency ===
                          EntryTimingFrequency.Weekly && (
                          <div className="flex">
                            {["M", "T", "W", "T", "F", "S", "S"].map(
                              (el, i) => {
                                const isChecked =
                                  !!journeyEntrySettings.entryTiming.time!
                                    .recurrence.weeklyOn[i];

                                return (
                                  <div
                                    key={i}
                                    className={`${
                                      isChecked &&
                                      "!bg-[#6366F1] !border-[#6366F1] !text-white"
                                    } py-[5px] px-[9.5px] bg-white border border-[#E5E7EB] cursor-pointer select-none hover:bg-[#E0E7FF] text-[#111827] font-roboto text-[14px] leading-[22px] transition-all`}
                                    onClick={() => {
                                      const newWeeklyOn = [
                                        ...journeyEntrySettings.entryTiming
                                          .time!.recurrence.weeklyOn,
                                      ];
                                      newWeeklyOn[i] = +!isChecked;

                                      dispatch(
                                        setJourneyEntryTimingTime({
                                          ...journeyEntrySettings.entryTiming
                                            .time!,
                                          recurrence: {
                                            ...journeyEntrySettings.entryTiming
                                              .time!.recurrence,
                                            weeklyOn: newWeeklyOn,
                                          },
                                        })
                                      );
                                    }}
                                  >
                                    {el}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[10px] mt-[20px]">
                      <div className="leading-[22px] text-[14px] font-semibold font-inter">
                        Ends
                      </div>
                      <div className="flex gap-[10px] items-center">
                        <select
                          value={
                            journeyEntrySettings.entryTiming.time.recurrence
                              .endsOn
                          }
                          onChange={(ev) =>
                            dispatch(
                              setJourneyEntryTimingTime({
                                ...journeyEntrySettings.entryTiming.time!,
                                recurrence: {
                                  ...journeyEntrySettings.entryTiming.time!
                                    .recurrence,
                                  endsOn: ev.target
                                    .value as RecurrenceEndsOption,
                                },
                              })
                            )
                          }
                          className="w-[180px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
                        >
                          <option value={RecurrenceEndsOption.Never}>
                            Never
                          </option>
                          <option value={RecurrenceEndsOption.After}>
                            After
                          </option>
                          <option value={RecurrenceEndsOption.SpecificDate}>
                            On a specific date
                          </option>
                        </select>
                        {journeyEntrySettings.entryTiming.time.recurrence
                          .endsOn === RecurrenceEndsOption.After ? (
                          <>
                            <input
                              type="number"
                              placeholder="value"
                              value={
                                journeyEntrySettings.entryTiming.time.recurrence
                                  .endAdditionalValue
                              }
                              onChange={(e) => {
                                dispatch(
                                  setJourneyEntryTimingTime({
                                    ...journeyEntrySettings.entryTiming.time!,
                                    recurrence: {
                                      ...journeyEntrySettings.entryTiming.time!
                                        .recurrence,
                                      endAdditionalValue:
                                        +e.target.value < 1
                                          ? 1
                                          : +e.target.value,
                                    },
                                  })
                                );
                              }}
                              className="w-full max-w-[80px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
                            />
                            <span className="text-[#111827] font-inter leading-[22px] text-[14px]">
                              occurrence(s)
                            </span>
                          </>
                        ) : (
                          journeyEntrySettings.entryTiming.time.recurrence
                            .endsOn === RecurrenceEndsOption.SpecificDate && (
                            <>
                              <DateComponent
                                value={
                                  journeyEntrySettings.entryTiming.time
                                    .recurrence.endAdditionalValue as string
                                }
                                onChange={(date) => {
                                  dispatch(
                                    setJourneyEntryTimingTime({
                                      ...journeyEntrySettings.entryTiming.time!,
                                      recurrence: {
                                        ...journeyEntrySettings.entryTiming
                                          .time!.recurrence,
                                        endAdditionalValue: isBefore(
                                          new Date(date),
                                          new Date()
                                        )
                                          ? addDays(new Date(), 1).toISOString()
                                          : date,
                                      },
                                    })
                                  );
                                }}
                              />
                            </>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="w-full mt-[20px]">
                  <CheckBox
                    text={"Enter users in their local time zone"}
                    initValue={
                      journeyEntrySettings.entryTiming.time.userLocalTimeZone
                    }
                    disabled
                    onCheck={(checked) => {
                      dispatch(
                        setJourneyEntryTimingTime({
                          ...journeyEntrySettings.entryTiming.time!,
                          userLocalTimeZone: checked,
                        })
                      );
                    }}
                  />
                </div>
              </div>
            )}
        </div>
        <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-base">Enrollment type</div>
          <RadioGroup
            value={journeyEntrySettings.enrollmentType}
            onChange={(el) => dispatch(setJourneyEntryEnrollmentType(el))}
          >
            {enrollmentTypes.map((el, i) => (
              <div className="flex flex-col mb-[10px]">
                <RadioOption
                  key={i}
                  value={el.type}
                  radioText={el.label}
                  className=""
                />
                <div className="text-[#4B5563] font-inter text-[12px] leading-5 font-normal">
                  {el.desc}
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-base">Eligible users</div>
          <div className="flex gap-5">
            <div
              className={`w-[390px] px-5 py-[10px] flex flex-col gap-[10px] rounded select-none cursor-pointer ${
                segmentsSettings.type === SegmentsSettingsType.ALL_CUSTOMERS
                  ? "border-2 border-[#6366F1] bg-[#EEF2FF]"
                  : "border border-[#E5E7EB]"
              }`}
              onClick={() =>
                dispatch(
                  setSegmentsSettings({
                    type: SegmentsSettingsType.ALL_CUSTOMERS,
                  })
                )
              }
            >
              <div className="font-semibold text-base">All customers</div>
              <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
                All users will be enrolled
              </div>
            </div>

            <div
              className={`w-[390px] px-5 py-[10px] flex flex-col gap-[10px] rounded select-none cursor-pointer ${
                segmentsSettings.type === SegmentsSettingsType.CONDITIONAL
                  ? "border-2 border-[#6366F1] bg-[#EEF2FF]"
                  : "border border-[#E5E7EB]"
              }`}
              onClick={() =>
                dispatch(
                  setSegmentsSettings({
                    type: SegmentsSettingsType.CONDITIONAL,
                    query: {
                      type: QueryType.ALL,
                      statements: [
                        {
                          type: QueryStatementType.ATTRIBUTE,
                          key: "",
                          comparisonType: ComparisonType.EQUALS,
                          valueType: StatementValueType.STRING,
                          subComparisonType: ObjectKeyComparisonType.KEY_EXIST,
                          subComparisonValue: "",
                          value: "",
                          dateComparisonType: DateComparisonType.ABSOLUTE,
                        },
                      ],
                    },
                  })
                )
              }
            >
              <div className="font-semibold text-base">
                When customer meets conditions
              </div>
              <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
                Define which users can be enrolled in this journey
              </div>
            </div>
          </div>
        </div>

        {segmentsSettings.type === SegmentsSettingsType.CONDITIONAL && (
          <div className="flex flex-col gap-[10px]">
            <div className="font-semibold text-base">Conditions</div>
            <FilterBuilder
              settings={segmentsSettings}
              onSettingsChange={(settings) =>
                dispatch(
                  setSegmentsSettings(settings as ConditionalSegmentsSettings)
                )
              }
            />
          </div>
        )}

        {(onSave || onCancel) && (
          <>
            <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
            <div className="flex gap-2.5">
              {onCancel && (
                <Button type={ButtonType.SECONDARY} onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {onSave && (
                <Button type={ButtonType.PRIMARY} onClick={onSave}>
                  Save
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlowBuilderSegmentEditor;
