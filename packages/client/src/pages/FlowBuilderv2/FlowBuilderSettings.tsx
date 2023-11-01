import { RadioGroup } from "@headlessui/react";
import CheckBox from "components/Checkbox/Checkbox";
import ToggleSwitch from "components/Elements/ToggleSwitch";
import RadioOption from "components/Radio/RadioOption";
import TagComponent from "components/TagComponent/TagComponent";
import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  JourneySettingsQuiteFallbackBehavior,
  setJourneySettingsQuiteHours,
  MaxOptions,
  setJourneySettingsMaxEntries,
  setMaxMessageSends,
  setJourneySettingsTags,
} from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";

const testExampleTags: string[] = [
  "a10",
  "b11",
  "c12",
  "d13",
  "e14",
  "f15",
  "g16",
  "h17",
  "k10",
];

const FlowBuilderSettings = () => {
  const [searchTagsValue, setSearchTagsValue] = useState("");
  const { journeySettings } = useAppSelector((store) => store.flowBuilder);
  const dispatch = useDispatch();

  return (
    <div className="m-[20px] max-h-full overflow-y-scroll w-full bg-white rounded-[4px] p-[20px] text-[#111827] font-inter">
      <div className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[20px]">
          <div className="font-semibold text-[16px] leading-[24px]">
            Journey Tags
          </div>
          <div className="max-w-[800px]">
            <TagComponent
              tags={journeySettings.tags}
              possibleTags={testExampleTags.filter((el) =>
                el.includes(searchTagsValue)
              )}
              onTagChange={(tags) => {
                dispatch(setJourneySettingsTags(tags));
              }}
              onInputChange={setSearchTagsValue}
            />
          </div>
        </div>
        <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center">
            <span
              className="flex cursor-pointer select-none"
              onClick={() => {
                dispatch(
                  setJourneySettingsQuiteHours({
                    ...journeySettings.quiteHours,
                    enabled: !journeySettings.quiteHours.enabled,
                  })
                );
              }}
            >
              <ToggleSwitch
                checked={journeySettings.quiteHours.enabled}
                iconRequired={false}
              />
              <div className="ml-[10px] font-semibold text-[16px] leading-[24px]">
                Quite hours
              </div>
            </span>
          </div>
          <div className="text-[#4B5563] font-inter text-[12px] leading-[20px] font-normal">
            Description description description
          </div>
          {journeySettings.quiteHours.enabled && (
            <div className="p-[10px] border border-[#E5E7EB] bg-[#F3F4F6] rounded max-w-[800px] flex flex-col gap-[10px]">
              <div className="flex gap-[20px]">
                <div className="flex flex-col w-full">
                  <div className="text-[#111827] font-inter text-[14px] leading-[22px] mb-[5px] font-semibold">
                    Start time
                  </div>
                  <div>
                    <input
                      value={journeySettings.quiteHours.startTime}
                      onChange={(e) => {
                        dispatch(
                          setJourneySettingsQuiteHours({
                            ...journeySettings.quiteHours,
                            startTime: e.target.value,
                          })
                        );
                      }}
                      type="time"
                      className="w-full h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
                      placeholder="Select start time"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-full">
                  <div className="text-[#111827] font-inter text-[14px] leading-[22px] mb-[5px] font-semibold">
                    End time
                  </div>
                  <div>
                    <input
                      value={journeySettings.quiteHours.endTime}
                      onChange={(e) => {
                        dispatch(
                          setJourneySettingsQuiteHours({
                            ...journeySettings.quiteHours,
                            endTime: e.target.value,
                          })
                        );
                      }}
                      type="time"
                      className="w-full h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
                      placeholder="Select date"
                    />
                  </div>
                </div>
              </div>
              <div className="text-[#111827] font-inter text-[14px] leading-[22px] font-semibold">
                Fallback behavior
              </div>
              <div className="text-[#4B5563] font-inter text-[12px] leading-[20px] font-normal">
                Description description description
              </div>
              <RadioGroup
                value={journeySettings.quiteHours.fallbackBehavior}
                onChange={(el) =>
                  dispatch(
                    setJourneySettingsQuiteHours({
                      ...journeySettings.quiteHours,
                      fallbackBehavior: el,
                    })
                  )
                }
              >
                <RadioOption
                  value={JourneySettingsQuiteFallbackBehavior.NextAvailableTime}
                  radioText="Send at next available time"
                  className={"mb-[10px]"}
                />
                <RadioOption
                  value={JourneySettingsQuiteFallbackBehavior.Abort}
                  radioText="Abort message"
                />
              </RadioGroup>
            </div>
          )}
        </div>
        <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center">
            <span
              className="flex cursor-pointer select-none"
              onClick={() => {
                dispatch(
                  setJourneySettingsMaxEntries({
                    ...journeySettings.maxEntries,
                    enabled: !journeySettings.maxEntries.enabled,
                  })
                );
              }}
            >
              <ToggleSwitch
                checked={journeySettings.maxEntries.enabled}
                iconRequired={false}
              />
              <div className="ml-[10px] font-semibold text-[16px] leading-[24px]">
                Max user entries
              </div>
            </span>
          </div>
          <div className="text-[#4B5563] font-inter text-[12px] leading-[20px] font-normal">
            Description description description
          </div>
          {journeySettings.maxEntries.enabled && (
            <div className="p-[10px] border border-[#E5E7EB] bg-[#F3F4F6] rounded max-w-[800px] flex flex-col gap-[10px]">
              <div className="text-[#111827] text-sm font-normal font-Inter leading-snug">
                Maximum users to potentially enter this Journey
              </div>
              <div className="flex items-center gap-[10px]">
                <select
                  value={journeySettings.maxEntries.maxEntries}
                  onChange={(ev) => {
                    dispatch(
                      setJourneySettingsMaxEntries({
                        ...journeySettings.maxEntries,
                        maxEntries: ev.target.value as MaxOptions,
                      })
                    );
                  }}
                  className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                >
                  {Object.values(MaxOptions).map((max) => (
                    <option key={max} value={max}>
                      {(+max).toLocaleString("en-US")}
                    </option>
                  ))}
                </select>
                <span className="text-[#111827] text-sm font-normal font-Inter leading-snug">
                  users
                </span>
              </div>
              <CheckBox
                text={"Enter users in their local time zone"}
                initValue={journeySettings.maxEntries.limitOnEverySchedule}
                onCheck={(checked) => {
                  dispatch(
                    setJourneySettingsMaxEntries({
                      ...journeySettings.maxEntries!,
                      limitOnEverySchedule: checked,
                    })
                  );
                }}
              />
            </div>
          )}
        </div>
        <div className="w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB] -translate-x-[20px]" />
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center">
            <span
              className="flex cursor-pointer select-none"
              onClick={() => {
                dispatch(
                  setMaxMessageSends({
                    ...journeySettings.maxMessageSends,
                    enabled: !journeySettings.maxMessageSends.enabled,
                  })
                );
              }}
            >
              <ToggleSwitch
                checked={journeySettings.maxMessageSends.enabled}
                iconRequired={false}
              />
              <div className="ml-[10px] font-semibold text-[16px] leading-[24px]">
                Max message sends
              </div>
            </span>
          </div>
          <div className="text-[#4B5563] font-inter text-[12px] leading-[20px] font-normal">
            Description description description
          </div>
          {journeySettings.maxMessageSends.enabled && (
            <div className="p-[10px] border border-[#E5E7EB] bg-[#F3F4F6] rounded max-w-[800px] flex flex-col gap-[10px]">
              <CheckBox
                text={"Limit max users who will receive messages"}
                initValue={
                  journeySettings.maxMessageSends.maxUsersReceive !== undefined
                }
                onCheck={(checked) => {
                  dispatch(
                    setMaxMessageSends({
                      ...journeySettings.maxMessageSends!,
                      maxUsersReceive: checked
                        ? MaxOptions.FiveHundredThousand
                        : undefined,
                    })
                  );
                }}
              />
              {journeySettings.maxMessageSends.maxUsersReceive !==
                undefined && (
                <div className="flex items-center gap-[10px]">
                  <select
                    value={journeySettings.maxMessageSends.maxUsersReceive}
                    onChange={(ev) => {
                      dispatch(
                        setMaxMessageSends({
                          ...journeySettings.maxMessageSends!,
                          maxUsersReceive: ev.target.value as MaxOptions,
                        })
                      );
                    }}
                    className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                  >
                    {Object.values(MaxOptions).map((max) => (
                      <option key={max} value={max}>
                        {(+max).toLocaleString("en-US")}
                      </option>
                    ))}
                  </select>
                  <span className="text-[#111827] text-sm font-normal font-Inter leading-snug">
                    users
                  </span>
                </div>
              )}
              <CheckBox
                text={"Limit the sending rate"}
                initValue={
                  journeySettings.maxMessageSends.maxSendRate !== undefined
                }
                onCheck={(checked) => {
                  dispatch(
                    setMaxMessageSends({
                      ...journeySettings.maxMessageSends!,
                      maxSendRate: checked
                        ? MaxOptions.FiveHundredThousand
                        : undefined,
                    })
                  );
                }}
              />
              {journeySettings.maxMessageSends.maxSendRate !== undefined && (
                <div className="flex items-center gap-[10px]">
                  <select
                    value={journeySettings.maxMessageSends.maxSendRate}
                    onChange={(ev) => {
                      dispatch(
                        setMaxMessageSends({
                          ...journeySettings.maxMessageSends!,
                          maxSendRate: ev.target.value as MaxOptions,
                        })
                      );
                    }}
                    className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                  >
                    {Object.values(MaxOptions).map((max) => (
                      <option key={max} value={max}>
                        {(+max).toLocaleString("en-US")}
                      </option>
                    ))}
                  </select>
                  <span className="text-[#111827] text-sm font-normal font-Inter leading-snug">
                    messages per minute
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderSettings;
