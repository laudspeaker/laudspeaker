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
  EntryTiming,
  EntryTimingFrequency,
  JourneyEnrollmentType,
  JourneyType,
  ObjectKeyComparisonType,
  QueryStatementType,
  QueryType,
  RecurrenceEndsOptions,
  SegmentsSettingsType,
  setJourneyEntryEnrollmentType,
  setJourneyEntryTimingTime,
  setJourneyEntryTimingType,
  setJourneyType,
  setSegmentsSettings,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DateComponent } from "./Elements/FlowBuilderDynamicInput";
import FilterBuilder from "./FilterBuilder/FilterBuilder";

const enrollmentTypes = [
  {
    type: JourneyEnrollmentType.CurrentAndFutureUsers,
    label: "Enroll current users and future matching users",
    desc: "Description description description",
  },
  {
    type: JourneyEnrollmentType.OnlyCurrent,
    label: (
      <>
        Only enroll <b>current</b> users
      </>
    ),
    desc: "Description description description",
  },
  {
    type: JourneyEnrollmentType.OnlyFuture,
    label: (
      <>
        Only enroll <b>future</b> matching users
      </>
    ),
    desc: "Description description description",
  },
];

const FlowBuilderSegmentEditor = () => {
  const {
    segments: segmentsSettings,
    journeyType,
    journeyEntrySettings,
  } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  if (!journeyEntrySettings) return <></>;

  return (
    <div className="m-[20px] max-h-full overflow-y-scroll w-full bg-white rounded-[4px] p-[20px] text-[#111827] font-inter">
      <div className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[16px] leading-[24px]">
            Entry Timing
          </div>
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
                <div className="flex w-full gap-[20px]">
                  <div className="flex flex-col w-full">
                    <div className="text-[#111827] font-inter text-[14px] leading-[22px] mb-[5px] font-semibold">
                      Start on date
                    </div>
                    <div>
                      <input
                        value={format(
                          new Date(
                            journeyEntrySettings.entryTiming.time.startDate
                          ),
                          "yyyy-MM-dd"
                        )}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);

                          let updatedDate = new Date(
                            journeyEntrySettings.entryTiming.time!.startDate
                          );
                          updatedDate = setYear(
                            updatedDate,
                            selectedDate.getFullYear()
                          );
                          updatedDate = setMonth(
                            updatedDate,
                            selectedDate.getMonth()
                          );
                          updatedDate = setDate(
                            updatedDate,
                            selectedDate.getDate()
                          );

                          dispatch(
                            setJourneyEntryTimingTime({
                              ...journeyEntrySettings.entryTiming.time!,
                              startDate: updatedDate.toISOString(),
                            })
                          );
                        }}
                        type="date"
                        className="w-full h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
                        placeholder="Select date"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="text-[#111827] font-inter text-[14px] leading-[22px] mb-[5px] font-semibold">
                      Time
                    </div>
                    <div>
                      <input
                        value={format(
                          new Date(
                            journeyEntrySettings.entryTiming.time.startDate
                          ),
                          "hh:mm"
                        )}
                        onChange={(e) => {
                          let updatedDate = new Date(
                            journeyEntrySettings.entryTiming.time!.startDate
                          );

                          const [hh, mm] = e.target.value.split(":");

                          updatedDate = setHours(updatedDate, +hh);
                          updatedDate = setMinutes(updatedDate, +mm);
                          updatedDate = setSeconds(updatedDate, 0);
                          updatedDate = setMilliseconds(updatedDate, 0);

                          dispatch(
                            setJourneyEntryTimingTime({
                              ...journeyEntrySettings.entryTiming.time!,
                              startDate: updatedDate.toISOString(),
                            })
                          );
                        }}
                        type="time"
                        className="w-full h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
                        placeholder="Select date"
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
                        className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
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
                          className="w-full max-w-[134px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
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
                                    .value as RecurrenceEndsOptions,
                                },
                              })
                            )
                          }
                          className="w-[180px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                        >
                          <option value={RecurrenceEndsOptions.Never}>
                            Never
                          </option>
                          <option value={RecurrenceEndsOptions.After}>
                            After
                          </option>
                          <option value={RecurrenceEndsOptions.SpecificDate}>
                            On a specific date
                          </option>
                        </select>
                        {journeyEntrySettings.entryTiming.time.recurrence
                          .endsOn === RecurrenceEndsOptions.After ? (
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
                              className="w-full max-w-[80px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
                            />
                            <span className="text-[#111827] font-inter leading-[22px] text-[14px]">
                              occurrence(s)
                            </span>
                          </>
                        ) : (
                          journeyEntrySettings.entryTiming.time.recurrence
                            .endsOn === RecurrenceEndsOptions.SpecificDate && (
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
          <div className="font-semibold text-[16px] leading-[24px]">
            Enrollment type
          </div>
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
                <div className="text-[#4B5563] font-inter text-[12px] leading-[20px] font-normal">
                  {el.desc}
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[16px] leading-[24px]">
            Eligible users
          </div>
          <div className="flex gap-[20px]">
            <div
              className={`w-[390px] px-[20px] py-[10px] flex flex-col gap-[10px] rounded-[4px] select-none cursor-pointer ${
                segmentsSettings.type === SegmentsSettingsType.ALL_CUSTOMERS
                  ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
                  : "border-[1px] border-[#E5E7EB]"
              }`}
              onClick={() =>
                dispatch(
                  setSegmentsSettings({
                    type: SegmentsSettingsType.ALL_CUSTOMERS,
                  })
                )
              }
            >
              <div className="font-semibold text-[16px] leading-[24px]">
                All customers
              </div>
              <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
                All users will be enrolled
              </div>
            </div>

            <div
              className={`w-[390px] px-[20px] py-[10px] flex flex-col gap-[10px] rounded-[4px] select-none cursor-pointer ${
                segmentsSettings.type === SegmentsSettingsType.CONDITIONAL
                  ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
                  : "border-[1px] border-[#E5E7EB]"
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
                        },
                      ],
                    },
                  })
                )
              }
            >
              <div className="font-semibold text-[16px] leading-[24px]">
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
            <div className="font-semibold text-[16px] leading-[24px]">
              Conditions
            </div>
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

        {/* <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[16px] leading-[24px]">
            Journey type
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            Dynamic journeys enroll new customers who meet conditions, while
            static journeys only enroll customers who meet conditions at start.
          </div>
          <div className="flex font-roboto font-normal text-[16px] leading-[24px]">
            <div
              className={`px-[16px] py-[8px] select-none cursor-pointer rounded-l-[2px] ${
                journeyType === JourneyType.DYNAMIC
                  ? "bg-[#6366F1] text-white"
                  : "border-[1px] border-[#9CA3AF]"
              }`}
              onClick={() => dispatch(setJourneyType(JourneyType.DYNAMIC))}
            >
              Dynamic journey
            </div>
            <div
              className={`px-[16px] py-[8px] select-none cursor-pointer rounded-r-[2px] ${
                journeyType === JourneyType.STATIC
                  ? "bg-[#6366F1] text-white"
                  : "border-[1px] border-[#9CA3AF]"
              }`}
              onClick={() => dispatch(setJourneyType(JourneyType.STATIC))}
            >
              Static journey
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default FlowBuilderSegmentEditor;
