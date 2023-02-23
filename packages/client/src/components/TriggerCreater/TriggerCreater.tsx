import React, { useState, useEffect, MouseEvent } from "react";
import { GenericButton, Input, Select } from "components/Elements";
import AC from "react-autocomplete";
import {
  getConditions,
  getEventResources,
} from "../../pages/Segment/SegmentHelpers";
import DateTimePicker from "components/Elements/DateTimePicker";
import ConditionCreater from "./ConditionCreator";
import ApiService from "services/api.service";
import AndOrSelect from "./AndOrSelect";
import { useDebounce } from "react-use";
import {
  EventCondition,
  ProviderTypes,
  Trigger,
  TriggerType,
} from "types/Workflow";
import { FormDataItem, IResource } from "pages/Segment/MySegment";
import { Resource } from "pages/EmailBuilder/EmailBuilder";
import MinusIcon from "../../assets/images/MinusIcon.svg";

interface ITriggerCreaterProp {
  triggerType: TriggerType;
  trigger: Trigger;
  onSave: (trigger: Trigger) => void;
  onDelete: (triggerId: string) => void;
  isViewMode: boolean;
}

interface Condition {
  attribute?: string;
  condition?: string;
  value?: string;
  type?: string;
}

const TriggerCreater = (props: ITriggerCreaterProp) => {
  const {
    triggerType: triggerProp,
    onSave,
    onDelete,
    trigger,
    isViewMode,
  } = props;

  const getAllResources = async (id: string) => {
    const response = await getEventResources(id);
    return response;
  };

  const [eventTrigger, setEventTrigger] = useState<Trigger>(trigger);

  const handleConditionsChange = (
    index: number,
    newCondition: EventCondition
  ) => {
    if (!eventTrigger?.properties?.conditions?.[index]) return;

    eventTrigger.properties.conditions[index] = newCondition;
    setEventTrigger((prev) => ({
      ...prev,
      conditions: [
        ...(prev.properties?.conditions?.map((condition) => ({
          ...condition,
        })) || []),
      ],
    }));
  };

  const populateFormData = (criteria: Condition[]) => {
    const parsedFormData = [];

    for (let index = 0; index < criteria?.length; index++) {
      let objToPush = {};
      if (criteria[index].type === "events") {
        objToPush = {
          conditions: {
            value: "events",
            isRoot: true,
            children: {
              events: {
                value: criteria[index].value,
                children: {},
              },
            },
            isDirty: true,
          },
        };
      } else {
        if (criteria[index].condition) {
          objToPush = {
            conditions: {
              value: "attributes",
              isRoot: true,
              children: {
                attributes: {
                  value: criteria[index].attribute,
                  children: {
                    [criteria[index].attribute as string]: {
                      value: criteria[index].condition,
                      children: {
                        [criteria[index].condition as string]: {
                          value: criteria[index].value,
                          children: {},
                        },
                      },
                    },
                  },
                },
              },
              isDirty: true,
            },
          };
        } else {
          objToPush = {
            conditions: {
              value: "attributes",
              isRoot: true,
              children: {
                attributes: {
                  value: criteria[index].attribute,
                  children: {
                    [criteria[index].attribute as string]: {
                      value: criteria[index].value,
                      children: {},
                    },
                  },
                },
              },
              isDirty: true,
            },
          };
        }
      }
      parsedFormData.push(objToPush);
    }
    if (!criteria?.length)
      parsedFormData.push({
        conditions: {
          value: "",
          isRoot: true,
          children: {},
        },
      });
    return parsedFormData;
  };

  const [resources, setResouces] = useState<IResource>({});
  const [formData, setFormData] = useState<FormDataItem[]>([]);

  const [triggerType, setTriggerType] = useState<TriggerType>(triggerProp);
  const [eventTimeSelect, setEventTimeSelect] = useState(
    trigger.properties?.eventTime || "Delay"
  );
  const [delayInputTime, setDelayInputTime] = useState(
    trigger.properties?.delayTime
  );
  const [datePickerSpecificTimeValue, setDatePickerSpecificTimeValue] =
    useState(trigger.properties?.specificTime);

  const [datePickerFromValue, setDatePickerFromValue] = useState(
    trigger.properties?.fromTime
  );
  const [datePickerToValue, setDatePickerToValue] = useState(
    trigger.properties?.toTime
  );

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleTimeDelayChange = (value: string) => {
    const arr: string[] = value.split(":");
    setIsButtonDisabled(!value.match(/\d\d:\d\d/));

    if (
      arr?.length > 2 ||
      (arr[0] && arr[0]?.length > 2) ||
      (arr[1] && arr[1]?.length > 2) ||
      arr.some((part: string) => isNaN(+part)) ||
      +arr[0] > 23 ||
      +arr[1] > 59
    ) {
      return;
    }

    setDelayInputTime(value);
  };

  const handleTimeSelectChange = (value: string) => {
    setIsButtonDisabled(true);
    setEventTimeSelect(value);
  };

  const handleTriggerType = (value: TriggerType) => {
    setTriggerType(value);
    setEventTrigger({ ...eventTrigger, type: value });
  };

  const handleSpecificTimeChange = (value: string | null) => {
    setIsButtonDisabled(!value || new Date(value) < new Date());
    if (value) setDatePickerSpecificTimeValue(value);
  };

  const handleToTimeChange = (value: string | null) => {
    setIsButtonDisabled(
      !datePickerToValue ||
        !datePickerFromValue ||
        datePickerToValue < datePickerFromValue
    );
    if (value) setDatePickerToValue(value);
  };

  const handleFromTimeChange = (value: string | null) => {
    setIsButtonDisabled(
      !datePickerToValue ||
        !datePickerFromValue ||
        datePickerToValue < datePickerFromValue
    );
    if (value) setDatePickerFromValue(value);
  };

  useEffect(() => {
    const getAllConditions = async () => {
      getConditions().then((response) => {
        setResouces((re) => ({
          ...re,
          [response.id]: response,
        }));
        setIsButtonDisabled(
          !(eventTrigger.properties?.conditions as { value: string }[])?.some(
            (item) => item.value
          ) || false
        );
        setFormData(
          populateFormData(eventTrigger.properties?.conditions || []) || [
            {
              [response.id]: {
                value: "",
                isRoot: true,
                children: {},
              },
            },
          ]
        );
        eventTrigger?.properties?.conditions?.forEach((item) => {
          for (const key of Object.keys(item)) {
            getAllResources(item[key as keyof EventCondition]).then(
              (resourceResponse) => {
                const tempResponse = JSON.parse(
                  JSON.stringify(resourceResponse)
                );
                setResouces((re) => ({
                  ...re,
                  [tempResponse.data.id]: tempResponse.data,
                }));
              }
            );
          }
        });
      });
    };
    if (triggerType === TriggerType.EVENT || "timeDelay") {
      getAllConditions();
    }
  }, [triggerType, eventTrigger.properties?.conditions]);

  const [possibleTypes, setPossibleTypes] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/events/possible-types" });
      setPossibleTypes(data);
    })();
  }, []);

  const recursivelyUpdateFormData = (
    formDataToUpdate: FormDataItem,
    lookupId: string,
    updateValue: string,
    childId: string,
    isRoot: boolean
  ) => {
    const returnedData: FormDataItem = {};
    for (const key in formDataToUpdate) {
      if (key === lookupId) {
        // update the data
        returnedData[key] = {
          ...formDataToUpdate[key],
          ...(isRoot && { isDirty: true }),
          value: updateValue,
          children: {
            ...(childId && {
              [childId]: {
                value: "",
                children: {},
              },
            }),
          },
        };
        return returnedData;
      } else {
        if (formDataToUpdate[key].children) {
          returnedData[key] = {
            ...formDataToUpdate[key],
            children: recursivelyUpdateFormData(
              formDataToUpdate[key].children,
              lookupId,
              updateValue,
              childId,
              isRoot
            ),
          };
        }
      }
    }
    return returnedData;
  };

  const updateFormData = ({
    formDataToUpdate,
    id,
    value,
    response,
    rowIndex,
    isRoot = false,
  }: {
    id: string;
    value: string;
    response: { data?: { id?: string } };
    formDataToUpdate: FormDataItem;
    rowIndex: number;
    isRoot?: boolean;
  }) => {
    const updatedData = recursivelyUpdateFormData(
      formDataToUpdate,
      id,
      value,
      response?.data?.id || "",
      isRoot
    );

    const tempData = [
      ...formData.slice(0, rowIndex),
      updatedData,
      ...formData.slice(rowIndex + 1),
    ];
    setFormData(tempData);
  };

  const updateEvent = async ({
    value,
    id,
    rowIndex,
    type,
    isRoot,
  }: {
    value: string;
    id: string;
    rowIndex: number;
    type: string;
    isRoot: boolean;
  }) => {
    setIsButtonDisabled(true);
    const formDataToUpdate = { ...formData[rowIndex] };
    if (type === "select") {
      let response: { data?: Resource } = {};
      const resourceId = value;
      getAllResources(resourceId)
        .then((resourceResponse) => {
          response = { ...resourceResponse };
          setResouces((re) => ({
            ...re,
            [resourceResponse.data.id]: resourceResponse.data,
          }));
        })
        .finally(() => {
          updateFormData({
            formDataToUpdate,
            id,
            value,
            response,
            rowIndex,
            isRoot,
          });
        });
    }
    if (type === "inputText" || type === "inputNumber") {
      setIsButtonDisabled(value === "" || value === undefined);
      updateFormData({
        formDataToUpdate,
        id,
        value,
        response: {},
        rowIndex,
      });
    }
    if (type === "dateRange" || type === "dateTime") {
      updateFormData({
        formDataToUpdate,
        id,
        value,
        response: {},
        rowIndex,
      });
    }
  };

  const handleEventBasedChange = ({
    value,
    id: key,
    type,
    isRoot,
  }: {
    value: string;
    id: string;
    type: string;
    isRoot: boolean;
  }) => {
    updateEvent({
      value,
      id: key,
      rowIndex: 0,
      type,
      isRoot,
    });
  };

  const deleteRow = () => {
    onDelete(trigger.id);
  };

  const handleData = async (func: (data: Trigger) => void) => {
    if (triggerType === TriggerType.TIME_DELAY)
      func({
        ...eventTrigger,
        properties: {
          conditions: [],
          specificTime: datePickerSpecificTimeValue,
          delayTime: delayInputTime,
          eventTime: eventTimeSelect,
        },
      });
    else if (triggerType === "timeWindow")
      func({
        ...eventTrigger,
        properties: {
          conditions: [],
          fromTime: datePickerFromValue,
          toTime: datePickerToValue,
        },
      });
    else if (triggerType === TriggerType.EVENT) {
      func(eventTrigger);
    }
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleData(onSave);
  };

  let jsx: JSX.Element | null = null;

  const generateTriggerUI = ({ toPart = false } = {}) => {
    switch (triggerType) {
      case "timeDelay": {
        jsx = (
          <>
            <div className="flex flex-col">
              <div>
                <Select
                  id="eventTime"
                  name="eventTime"
                  value={eventTimeSelect}
                  options={[
                    { value: "Delay", title: "Delay" },
                    { value: "SpecificTime", title: "Specific Time" },
                  ]}
                  onChange={handleTimeSelectChange}
                  displayEmpty
                  disabled={isViewMode}
                  customButtonClass={`${
                    isViewMode && "!bg-gray-200 !cursor-auto opacity-[0.7]"
                  }`}
                  wrapperClassnames="max-w-[200px]"
                />
              </div>
              {eventTimeSelect ? (
                <>
                  <div>
                    {eventTimeSelect == "SpecificTime" && (
                      <div>
                        <DateTimePicker
                          value={datePickerSpecificTimeValue || ""}
                          handleChange={handleSpecificTimeChange}
                          dateStyle="short"
                          timeStyle="short"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    {eventTimeSelect !== "SpecificTime" && (
                      <Input
                        name="delayTime"
                        id="delayTime"
                        value={delayInputTime}
                        onChange={(e) => handleTimeDelayChange(e.target.value)}
                        placeholder="HH:MM"
                        className="mt-[24px] max-w-[200px]"
                      />
                    )}
                  </div>
                  <div>
                    {eventTimeSelect !== "SpecificTime" && (
                      <div
                        style={{
                          margin: "10px 0",
                          width: "auto",
                          height: "44px",
                          borderRadius: "24px",
                          border: "1px solid #DEDEDE",
                          padding: "10px 20px",
                          background: "#FFF",
                          textAlign: "center",
                          fontSize: "16px",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          maxWidth: "200px",
                        }}
                      >
                        after user entered state
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          </>
        );
        break;
      }
      case "timeWindow": {
        jsx = (
          <div className="flex flex-col flex-wrap">
            {toPart ? (
              <div className="flex flex-col mt-[10px]">
                <div id="toValueDate">
                  <DateTimePicker
                    value={datePickerToValue || ""}
                    handleChange={handleToTimeChange}
                    dateStyle="short"
                    timeStyle="short"
                  />
                </div>
                <div
                  style={{
                    margin: "10px 0",
                    width: "auto",
                    height: "44px",
                    borderRadius: "24px",
                    border: "1px solid #DEDEDE",
                    padding: "10px 20px",
                    background: "#FFF",
                    textAlign: "center",
                    fontSize: "16px",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                  }}
                >
                  after user has left audience state
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-[15px] mb-[20px]">
                <div id="fromValueDate">
                  <DateTimePicker
                    value={datePickerFromValue || ""}
                    handleChange={handleFromTimeChange}
                    dateStyle="short"
                    timeStyle="short"
                  />
                </div>
                <div
                  style={{
                    margin: "auto 0",
                    width: "auto",
                    height: "44px",
                    borderRadius: "24px",
                    border: "1px solid #DEDEDE",
                    padding: "10px 20px",
                    background: "#FFF",
                    textAlign: "center",
                    fontSize: "16px",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                  }}
                >
                  after user has entered audience state
                </div>
              </div>
            )}
          </div>
        );
        break;
      }
      default:
        break;
    }
    return <>{jsx}</>;
  };

  const handleDeleteCondition = (i: number) => {
    setEventTrigger((prev) => ({
      ...prev,
      properties: {
        conditions: [
          ...(prev?.properties?.conditions?.filter(
            (_condition, index) => index !== i
          ) || []),
        ],
      },
    }));
  };

  let eventBasedErrorMessage = "";

  for (
    let i = 0;
    i < (eventTrigger?.properties?.conditions?.length || 0);
    i++
  ) {
    const condition = eventTrigger?.properties?.conditions?.[i];
    // for (const key of Object.keys(condition)) {
    //   if (!condition[key as keyof EventCondition]) {
    //     eventBasedErrorMessage = `${key} is not defined at position ${i + 1}`;
    //   }
    // }

    if (!condition?.key) {
      eventBasedErrorMessage = `Key is not defined at position ${i + 1}`;
      break;
    }

    if (!condition?.type) {
      eventBasedErrorMessage = `Type is not defined at position ${i + 1}`;
      break;
    }

    if (!condition?.comparisonType) {
      eventBasedErrorMessage = `Comparison type is not defined at position ${
        i + 1
      }`;
      break;
    }

    if (
      !condition.value &&
      !["exists", "doesNotExist"].includes(condition.comparisonType)
    ) {
      eventBasedErrorMessage = `Value is not defined at position ${i + 1}`;
      break;
    }
  }

  const [possiblePosthogEventTypes, setPossiblePosthogEventTypes] = useState<
    string[]
  >([]);

  const loadPossiblePosthogEventTypes = async () => {
    const { data } = await ApiService.get({
      url:
        "/events/possible-posthog-types?search=" +
        (eventTrigger.providerParams || ""),
    });
    setPossiblePosthogEventTypes(data);
  };

  useDebounce(
    () => {
      loadPossiblePosthogEventTypes();
    },
    1000,
    [eventTrigger.providerParams]
  );

  let isError = false;

  switch (triggerType) {
    case TriggerType.EVENT:
      isError = !!eventBasedErrorMessage;
      break;
    case TriggerType.TIME_DELAY:
      isError =
        eventTimeSelect === "SpecificTime"
          ? !datePickerSpecificTimeValue
          : !delayInputTime || !delayInputTime.match(/\d\d:\d\d/);
      break;
    case TriggerType.TIME_WINDOW:
      isError =
        !datePickerFromValue ||
        !datePickerToValue ||
        new Date(datePickerFromValue) > new Date(datePickerToValue);
      break;
  }

  return (
    <>
      <div className="h-full">
        <div className="mb-5">
          <Select
            label="Trigger type"
            value={triggerType}
            options={[
              { value: TriggerType.EVENT, title: "Event Based" },
              { value: TriggerType.TIME_DELAY, title: "Time Delay" },
              { value: TriggerType.TIME_WINDOW, title: "Time Window" },
            ]}
            onChange={handleTriggerType}
            wrapperClassnames="max-w-[200px]"
          />
        </div>
        <div className="mb-5">
          <Select
            label="Branching Options"
            value="single"
            options={[
              { value: "single", title: "Single branch" },
              { value: "truefalse", title: "True/False", disabled: true },
              { value: "multibranch", title: "Multibranch", disabled: true },
            ]}
            onChange={() => {}}
            wrapperClassnames="max-w-[200px]"
          />
        </div>
        <div className="rounded-[10px] relative shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center relative">
            <div className="rounded-[10px] flex items-center cursor-pointer w-full">
              <div className="flex flex-[1] flex-wrap flex-col">
                {eventTrigger.type === TriggerType.EVENT && (
                  <div className="w-full flex flex-col mb-[10px]">
                    <Select
                      label="Event type"
                      onChange={(val) =>
                        setEventTrigger({
                          ...eventTrigger,
                          providerType: val,
                        })
                      }
                      options={[
                        { value: ProviderTypes.Posthog, title: "Posthog" },
                        { value: ProviderTypes.Custom, title: "Custom" },
                      ]}
                      disabled={isViewMode}
                      wrapperClassnames="max-w-[200px] w-full mr-[15px]"
                      value={eventTrigger.providerType || ProviderTypes.Custom}
                    />
                    {eventTrigger.providerType === ProviderTypes.Posthog && (
                      <div className="relative">
                        <AC
                          getItemValue={(item) => item}
                          items={[...possiblePosthogEventTypes]}
                          autoHighlight={false}
                          // eslint-disable-next-line @typescript-eslint/no-shadow
                          renderInput={(props) => (
                            <Input
                              name={props.name || ""}
                              value={props.value}
                              onChange={props.onChange}
                              inputRef={props.ref}
                              aria-expanded={props["aria-expanded"]}
                              disabled={isViewMode}
                              id="keyInput"
                              {...props}
                            />
                          )}
                          renderItem={(item, isHighlighted) => (
                            <div
                              className={`${
                                isHighlighted ? "bg-cyan-100" : ""
                              } p-[2px] rounded-[6px] relative max-w-full break-all`}
                            >
                              {item}
                            </div>
                          )}
                          renderMenu={(items) => {
                            if (!items.length) return <></>;

                            return (
                              <div className="max-h-[200px] overflow-y-scroll shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                                {items}
                              </div>
                            );
                          }}
                          value={eventTrigger.providerParams}
                          onChange={(e) => {
                            setEventTrigger({
                              ...eventTrigger,
                              providerParams: e.target.value,
                            });
                          }}
                          onSelect={(val) => {
                            setEventTrigger({
                              ...eventTrigger,
                              providerParams: val,
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {triggerType === TriggerType.TIME_WINDOW && (
                  <div className="w-full flex mb-[10px]">
                    <Select
                      options={[{ value: "From" }]}
                      value="From"
                      onChange={() => {}}
                      wrapperClassnames="w-full max-w-[200px]"
                    />
                  </div>
                )}
                {triggerType === "eventBased" ? (
                  <>
                    <div>
                      {eventTrigger.properties?.conditions?.map(
                        (condition, i) => (
                          <>
                            <div className="flex items-center">
                              <span className="mr-[5px]">{i + 1}</span>
                              <div className="h-[1px] w-full bg-blue-gray-300" />
                              {!isViewMode && (
                                <img
                                  className="ml-[5px]"
                                  onClick={() => handleDeleteCondition(i)}
                                  src={MinusIcon}
                                />
                              )}
                            </div>
                            <ConditionCreater
                              condition={condition}
                              onChange={(updatedCondition) =>
                                handleConditionsChange(i, updatedCondition)
                              }
                              possibleTypes={possibleTypes}
                              isViewMode={isViewMode}
                              specificProvider={
                                eventTrigger.providerType ||
                                ProviderTypes.Custom
                              }
                            />
                            {i !==
                              (eventTrigger?.properties?.conditions?.length ||
                                0) -
                                1 && (
                              <div className="max-w-[7%]">
                                <AndOrSelect
                                  value={condition.relationWithNext || "and"}
                                  onChange={(val) =>
                                    handleConditionsChange(i, {
                                      ...condition,
                                      relationWithNext: val,
                                    })
                                  }
                                  disabled={isViewMode}
                                />
                              </div>
                            )}
                          </>
                        )
                      )}
                    </div>
                    {eventTrigger.properties?.conditions?.length === 10 && (
                      <span className="text-red-500">
                        Maximum 10 conditions allowed
                      </span>
                    )}
                    {!isViewMode && (
                      <div>
                        <GenericButton
                          onClick={() =>
                            setEventTrigger({
                              ...eventTrigger,
                              properties: {
                                ...eventTrigger.properties,
                                conditions: [
                                  ...(eventTrigger?.properties?.conditions ||
                                    []),
                                  {
                                    key: "",
                                    value: "",
                                    comparisonType: "",
                                    type: "",
                                    relationWithNext: "and",
                                    isArray: false,
                                  },
                                ],
                              },
                            })
                          }
                          disabled={
                            eventTrigger.properties?.conditions?.length === 10
                          }
                        >
                          Add new condition
                        </GenericButton>
                      </div>
                    )}
                  </>
                ) : (
                  generateTriggerUI()
                )}
              </div>
            </div>
          </div>
          {triggerType === "timeWindow" && (
            <>
              <div className="flex flex-col gap-[15px]">
                <div>
                  <Select
                    id="activeJourney"
                    value={triggerType}
                    options={[{ value: TriggerType.TIME_WINDOW, title: "To" }]}
                    onChange={handleTriggerType}
                    displayEmpty
                    disabled={isViewMode}
                    customButtonClass={`${
                      isViewMode && "!bg-gray-200 !cursor-auto opacity-[0.7]"
                    }`}
                    wrapperClassnames="max-w-[200px]"
                  />
                </div>
              </div>
              <div className="flex items-center relative">
                <div className="rounded-[10px] flex items-center cursor-pointer w-full">
                  <div className="flex flex-[1] flex-wrap">
                    {generateTriggerUI({ toPart: true })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {triggerType === "eventBased" && (
          <div className="text-red-500 max-w-[200px] overflow-hidden">
            {eventBasedErrorMessage}
          </div>
        )}
        {!isViewMode && (
          <div className="mt-[10px] flex flex-col gap-[20px]">
            <div data-savetriggerreator>
              <GenericButton
                onClick={handleSubmit}
                style={{
                  width: "200px",
                }}
                id="save-trigger"
                disabled={isError}
              >
                Save
              </GenericButton>
            </div>
            <GenericButton
              onClick={deleteRow}
              style={{
                maxWidth: "200px",
                background: "#D3D3D3",
                width: "200px",
                color: "#28282E",
              }}
            >
              Delete
            </GenericButton>
          </div>
        )}
      </div>
    </>
  );
};

export default TriggerCreater;
