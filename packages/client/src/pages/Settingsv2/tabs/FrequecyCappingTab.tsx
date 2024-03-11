import React, { useState } from "react";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { Divider } from "@mui/material";
import Select from "components/Elements/Selectv2";
import TrashIcon from "assets/icons/TrashIcon";
import { useAppSelector } from "store/hooks";
import { useDispatch } from "react-redux";
import TagComponent from "components/TagComponent/TagComponent";
import {
  MessageFromJourney,
  QueryStatementType,
  setJourneySettingsTags,
} from "reducers/flow-builder.reducer";

type AddConditionProps = {
  removeCondition: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  setFrequencyCappingRules: (frequencyCappingRules: any) => void;
  frequencyCappingRules: any;
};

type FrequencyCappingRules = {
  enabled: boolean;
  noMoreThan: string;
  typeSending: string;
  from: string;
  every: string;
  timeOption: string;
};

const AddCondition = ({
  removeCondition,
  setFrequencyCappingRules,
  frequencyCappingRules,
}: AddConditionProps) => {
  const [searchTagsValue, setSearchTagsValue] = useState("");
  const { journeySettings, availableTags } = useAppSelector(
    (store) => store.flowBuilder
  );
  const dispatch = useDispatch();

  return (
    <div className="flex justify-end items-center">
      <div className="w-full flex justify-between">
        <div className="flex flex-wrap gap-[5px] items-center mr-2.5">
          <div className="text-[14px] text-nowrap font-normal leading-[22px] text-[#111827]">
            No more than
          </div>
          <input
            className="h-8 border-none w-[100px] placeholder:text-[14px] placeholder:font-normal placeholder:leading-[22px]"
            value={frequencyCappingRules.noMoreThan}
            placeholder="number"
            id="no-more-than"
            onChange={(e) => {
              setFrequencyCappingRules({
                ...frequencyCappingRules,
                noMoreThan: e.target.value,
              });
            }}
          />
          <Select
            className="!w-[100px]"
            buttonInnerWrapperClassName="border-none rounded-none h-[32px] w-[100px]"
            options={[
              {
                title: QueryStatementType.EMAIL,
                key: QueryStatementType.EMAIL,
              },
              {
                title: QueryStatementType.PUSH,
                key: QueryStatementType.PUSH,
              },
              {
                title: QueryStatementType.SMS,
                key: QueryStatementType.SMS,
              },
              {
                title: QueryStatementType.IN_APP,
                key: QueryStatementType.IN_APP,
              },
            ]}
            placeholder="Email"
            value={frequencyCappingRules.typeSending}
            onChange={(value) => {
              setFrequencyCappingRules({
                ...frequencyCappingRules,
                typeSending: value,
              });
            }}
          />
          <div className="text-[14px] font-normal leading-[22px] text-[#111827]">
            from
          </div>
          <Select
            className="!w-[200px]"
            buttonInnerWrapperClassName="border-none rounded-none h-[32px] w-[200px]"
            options={[
              {
                title: "Any journeys",
                key: MessageFromJourney.ANY,
              },
              {
                title: "Journeys with a tag",
                key: MessageFromJourney.WITH_TAG,
              },
            ]}
            value={frequencyCappingRules.from}
            onChange={(value) => {
              setFrequencyCappingRules({
                ...frequencyCappingRules,
                from: value,
              });
            }}
          />
          {frequencyCappingRules.from === MessageFromJourney.WITH_TAG && (
            <TagComponent
              className="border-none w-[120px]"
              tags={journeySettings.tags}
              possibleTags={availableTags.filter((el) =>
                el.includes(searchTagsValue)
              )}
              onTagChange={(tags) => {
                dispatch(setJourneySettingsTags(tags));
              }}
              onInputChange={setSearchTagsValue}
            />
          )}
          <div className="text-[14px] font-normal leading-[22px] text-[#111827]">
            every
          </div>
          <input
            className="h-8 border-none w-[100px] placeholder:text-[14px] placeholder:font-normal placeholder:leading-[22px]"
            value={frequencyCappingRules.every}
            placeholder="number"
            id="every"
            onChange={(e) => {
              setFrequencyCappingRules({
                ...frequencyCappingRules,
                every: e.target.value,
              });
            }}
          />
          <Select
            className="!w-[100px]"
            buttonInnerWrapperClassName="border-none rounded-none h-[32px] w-[100px]"
            options={[
              {
                title: "Day",
                key: "Day",
              },
              {
                title: "Minute",
                key: "Minute",
              },
              {
                title: "Week",
                key: "Week",
              },
            ]}
            value={frequencyCappingRules.timeOption}
            onChange={(value) => {
              setFrequencyCappingRules({
                ...frequencyCappingRules,
                timeOption: value,
              });
            }}
          />
        </div>
      </div>
      <button className="ml-auto" onClick={removeCondition}>
        <TrashIcon />
      </button>
    </div>
  );
};

const FrequencyCappingTab = ({
  handleShowModal,
}: {
  handleShowModal: () => void;
}) => {
  // TODO: Retrieve the current frequency capping settings from the API
  const [conditions, setConditions] = useState<
    { id: number; frequencyCappingRules: FrequencyCappingRules }[]
  >([]);

  const removeCondition = (id: number) => {
    setConditions((prevConditions) =>
      prevConditions.filter((condition) => condition.id !== id)
    );
  };

  const defaultFrequencyCappingRules = {
    enabled: false,
    noMoreThan: "",
    typeSending: "Email",
    from: "Any journeys",
    every: "",
    timeOption: "Day",
  };

  const addCondition = () => {
    const newId = conditions.length + 1;
    setConditions((prevConditions) => [
      ...prevConditions,
      { id: newId, frequencyCappingRules: { ...defaultFrequencyCappingRules } },
    ]);
  };

  const updateCondition = (
    id: number,
    newFrequencyCappingRules: FrequencyCappingRules
  ) => {
    setConditions((prevConditions) =>
      prevConditions.map((condition) =>
        condition.id === id
          ? { ...condition, frequencyCappingRules: newFrequencyCappingRules }
          : condition
      )
    );
  };

  return (
    <div className="p-5 font-inter flex flex-col gap-5">
      <h1 className="text-base font-bold text-black">Frequency capping</h1>
      <h2 className="text-sm leading-[22px] text-black flex items-center">
        Currently,
        <button className="text-[#6366F1] mx-1" onClick={handleShowModal}>
          3 journeys
        </button>
        are included under this frequency capping setting.
      </h2>
      {conditions.map((condition) => (
        <div
          className="flex max-w-[924px] gap-2.5 relative w-full flex-nowrap items-center"
          key={condition.id}
        >
          {condition.id > 1 && (
            <div className="absolute bottom-[100px] md:bottom-[75px] lg:bottom-[50px] xl:bottom-[35px] left-[23px] z-[0] h-full w-[1px] bg-[#E5E7EB]" />
          )}
          <div>
            <div className="rounded-[14px] bg-[#F3F4F6] z-[1] py-0.5 px-2.5 text-xs leading-5 relative font-semibold">
              AND
            </div>
          </div>
          <div className="bg-[#F3F4F6] rounded p-2.5 w-full">
            <AddCondition
              removeCondition={() => removeCondition(condition.id)}
              setFrequencyCappingRules={(newRules) =>
                updateCondition(condition.id, newRules)
              }
              frequencyCappingRules={condition.frequencyCappingRules}
            />
          </div>
        </div>
      ))}
      <Button
        onClick={addCondition}
        type={ButtonType.SECONDARY}
        className="w-fit"
      >
        Add condition
      </Button>
      <Divider />
      <div className="flex gap-2.5">
        {/* TODO: Make API call to save the Frequency capping settings */}
        <Button type={ButtonType.PRIMARY} onClick={() => console.log("save")}>
          Save
        </Button>
        <Button
          type={ButtonType.SECONDARY}
          onClick={() => console.log("cancel")}
          disabled={true}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default FrequencyCappingTab;
