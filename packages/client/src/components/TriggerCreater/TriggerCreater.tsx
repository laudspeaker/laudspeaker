import React, { useState, useEffect } from "react";
import { FormControl } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import {
  getConditions,
  getEventResources,
  transformDataToUI,
} from "../../pages/Segment/SegmentHelpers";
import Card from "components/Cards/Card";
import {
  ISegmentInclusionForm,
  InclusionCriteria,
} from "pages/Segment/MySegment";
import DateTimePicker from "components/Elements/DateTimePicker";
import ConditionCreater from "./ConditionCreator";
import ApiService from "services/api.service";
import AndOrSelect from "./AndOrSelect";
import {
  EventCondition,
  EventTrigger,
  PosthogTriggerParams,
  ProviderTypes,
} from "types/triggers";

export type TriggerType = "eventBased" | "timeDelay" | "timeWindow";
interface ITriggerCreaterProp {
  updateFormData?: any;
  formData?: any;
  triggerId?: any;
  resources?: any;
  handleDeleteRow?: any;
  rowLength?: number;
  canDeleteRow?: boolean;
  triggerType: TriggerType;
  trigger?: any;
  onSave?: any;
  onDelete?: any;
  hasExitButton?: boolean;
  isViewMode?: boolean;
}
interface Condition {
  attribute: string;
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
    hasExitButton,
    isViewMode,
  } = props;

  const getAllResources = async (id: any) => {
    const response = await getEventResources(id);
    return response;
  };

  const [eventTrigger, setEventTrigger] = useState<EventTrigger>(trigger);

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

  const populateFormData: any = (criteria: Condition[]) => {
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
                    [criteria[index].attribute]: {
                      value: criteria[index].condition,
                      children: {
                        [criteria[index].condition as any]: {
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
                    [criteria[index].attribute]: {
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

  const [resources, setResouces] = useState<any>({});
  const [formData, setFormData] = useState<any>([]);
  const [titleEdit, setTitleEdit] = useState<boolean>(false);

  const [segmentForm, setSegmentForm] = useState<ISegmentInclusionForm>({
    title: "Custom Event Trigger",
  });

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  const handleSegmentFormChange = (e: any) => {
    setSegmentForm({
      ...segmentForm,
      [e.target.name]: e.target.value,
    });
  };

  const {
    fromDuration,
    fromMetric,
    toDuration,
    toMetric,
    eventTime,
    month,
    timer,
    day,
    delayTime,
    year,
  } = trigger.properties;
  const [timeWindow, setTimeWindow] = useState<any>({
    fromDuration,
    fromMetric,
    toDuration,
    toMetric,
  });
  const attributeRequestBodyKeys = ["attribute", "condition", "value"];

  const [triggerType, setTriggerType] = useState<TriggerType>(triggerProp);
  const [eventTimeSelect, setEventTimeSelect] = useState(eventTime);
  const [delayInputTime, setDelayInputTime] = useState(delayTime || "");

  const [datePickerSpecificTimeValue, setDatePickerSpecificTimeValue] =
    useState(new Date().toISOString());

  const [datePickerFromValue, setDatePickerFromValue] = useState(
    new Date().toISOString()
  );

  const [datePickerToValue, setDatePickerToValue] = useState(
    new Date().toISOString()
  );

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleTimeDelayChange = (value: any) => {
    const arr: string[] = value.split(":");
    setIsButtonDisabled(!value.match(/\d\d:\d\d:\d\d/));
    if (
      arr?.length > 3 ||
      (arr[0] && arr[0]?.length > 2) ||
      (arr[1] && arr[1]?.length > 2) ||
      (arr[2] && arr[2]?.length > 3) ||
      arr.some((part: string) => isNaN(+part)) ||
      +arr[0] > 59 ||
      +arr[1] > 23
    ) {
      return;
    }
    setDelayInputTime(value);
  };

  const handleTimeSelectChange = (value: any) => {
    setIsButtonDisabled(true);
    setEventTimeSelect(value);
  };

  const handletriggerType = (value: any) => {
    setTriggerType(value);
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
        setResouces((e: any) => ({
          ...e,
          [response.id]: response,
        }));
        setIsButtonDisabled(
          !(eventTrigger.properties?.conditions as { value: string }[])?.some(
            (item) => item.value
          ) || false
        );
        setFormData(
          populateFormData(eventTrigger.properties?.conditions) || [
            {
              [response.id]: {
                value: "",
                isRoot: true,
                children: {},
              },
            },
          ]
        );
        eventTrigger?.properties?.conditions?.forEach((item: any) => {
          for (const key in item) {
            getAllResources(item[key]).then((resourceResponse) => {
              const tempResponse = JSON.parse(JSON.stringify(resourceResponse));
              setResouces((re: any) => ({
                ...re,
                [tempResponse.data.id]: tempResponse.data,
              }));
            });
          }
        });
      });
    };
    if (triggerType === "eventBased" || "timeDelay") {
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
    formDataToUpdate: any,
    lookupId: any,
    updateValue: any,
    childId: any,
    isRoot: boolean
  ) => {
    const returnedData: any = {};
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
  }: any) => {
    const updatedData = recursivelyUpdateFormData(
      formDataToUpdate,
      id,
      value,
      response?.data?.id || "",
      isRoot
    );
    let shouldAddRow = false;
    for (const key in formData[formData?.length - 1]) {
      if (
        !updatedData.isDirty &&
        (formData?.length === 1 ||
          formData[formData?.length - 1][key].value === "")
      ) {
        shouldAddRow = true;
      }
    }

    const tempData = [
      ...formData.slice(0, rowIndex),
      updatedData,
      ...formData.slice(rowIndex + 1),
    ];
    setFormData(tempData);
  };

  const updateEvent = async ({ value, id, rowIndex, type, isRoot }: any) => {
    setIsButtonDisabled(true);
    const formDataToUpdate = JSON.parse(JSON.stringify(formData[rowIndex]));
    if (type === "select") {
      let response: any = {};
      const resourceId = value;
      getAllResources(resourceId)
        .then((resourceResponse) => {
          response = JSON.parse(JSON.stringify(resourceResponse));
          setResouces((re: any) => ({
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

  const handleEventBasedChange = ({ value, id: key, type, isRoot }: any) => {
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

  const flatten = (obj: any, prefix: any = [], current: any = {}) => {
    if (typeof obj === "object" && obj !== null) {
      for (const key of Object.keys(obj)) {
        flatten(obj[key], prefix.concat(key), current);
      }
    } else {
      current[prefix.join(".")] = obj;
    }
    return current;
  };

  const generateConditions = (obj: any) => {
    const result: any = {};
    if (obj.children && Object.keys(obj.children)?.length) {
      result[obj.value] = generateConditions(obj.children[obj.value]);
    } else {
      result.value = obj.value;
    }

    return result;
  };

  const handleData = async (func: (data: any) => void) => {
    if (triggerType == "timeDelay")
      func(JSON.parse(JSON.stringify(delayInputTime)));
    else if (triggerType == "timeWindow") func(timeWindow);
    else if (triggerType == "eventBased") {
      func(eventTrigger);
    }
  };

  const handleSubmit: any = async (e: any) => {
    e.preventDefault();
    handleData(onSave);
  };

  const generateFormData = (
    data: any,
    index: any,
    optionsFilter = (item: { label: string }) => item.label !== undefined
  ) => {
    const formElements: React.ReactNode[] = [];
    const filteredOptions = (
      resources.conditions.options as { label: string }[]
    ).filter(optionsFilter);
    const resouresWithFilteredOptions = { ...resources };
    resouresWithFilteredOptions.conditions.options = filteredOptions;
    for (const key in data) {
      formElements.push(
        transformDataToUI({
          data: resources[key],
          onChange: handleEventBasedChange,
          isRoot: data[key]?.isRoot,
          value: data[key]?.value,
          id: key,
          disabled: isViewMode,
        })
      );
      if (data?.[key]?.children && Object.keys(data?.[key]?.children)?.length) {
        formElements.push(generateFormData(data?.[key]?.children, index));
      }
    }
    return formElements;
  };

  let jsx: JSX.Element | null = null;

  const generateTriggerUI = ({ toPart = false } = {}) => {
    switch (triggerType) {
      case "eventBased": {
        jsx = formData?.map((item: any, index: number) =>
          generateFormData(
            item,
            index,
            (option) => option.label != "Attributes"
          )
        );
        break;
      }
      case "timeDelay": {
        jsx = (
          <>
            <div className="flex items-center">
              <FormControl
                sx={{
                  padding: "0 15px",
                  marging: "auto 0",
                  width: "auto",
                }}
              >
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
                  sx={{
                    height: "44px",
                    "& .MuiSelect-select": {
                      padding: "9px 15px",
                      border: "1px solid #DEDEDE",
                      paddingRight: "50px !important",
                      boxShadow: "none",
                    },
                  }}
                />
              </FormControl>
              {eventTimeSelect ? (
                <>
                  <FormControl
                    sx={{
                      padding: "0 15px",
                      width: "auto",
                    }}
                  >
                    {eventTimeSelect == "SpecificTime" && (
                      <FormControl
                        sx={{
                          padding: "0 15px",
                          marging: "auto 0",
                          width: "auto",
                        }}
                      >
                        <DateTimePicker
                          value={datePickerSpecificTimeValue}
                          handleChange={handleSpecificTimeChange}
                          dateStyle="short"
                          timeStyle="short"
                        />
                      </FormControl>
                    )}
                  </FormControl>
                  <FormControl
                    sx={{
                      padding: "0 15px",
                      marging: "auto 0",
                      width: "auto",
                    }}
                  >
                    {eventTimeSelect == "SpecificTime"
                      ? undefined
                      : transformDataToUI({
                          data: { type: "inputText" },
                          onChange: ({ value }: any) =>
                            handleTimeDelayChange(value),
                          isRoot: formData.conditions?.isRoot,
                          value: delayInputTime,
                          id: "delayTime",
                          placeholderText: "MM:HH:Days",
                        })}
                  </FormControl>
                  <FormControl
                    sx={{
                      padding: "0 15px",
                      width: "auto",
                    }}
                  >
                    {eventTimeSelect == "SpecificTime" ? undefined : (
                      <FormControl
                        sx={{
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
                        }}
                      >
                        after user entered state
                      </FormControl>
                    )}
                  </FormControl>
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
              <div className="flex items-center mt-[10px]">
                <FormControl
                  sx={{
                    padding: "0 15px",
                    marging: "auto 0",
                    width: "auto",
                  }}
                >
                  <DateTimePicker
                    value={datePickerToValue}
                    handleChange={handleToTimeChange}
                    dateStyle="short"
                    timeStyle="short"
                  />
                </FormControl>
                <FormControl
                  sx={{
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
                  }}
                >
                  after user has left audience state
                </FormControl>
              </div>
            ) : (
              <div className="flex items-center">
                <FormControl
                  sx={{
                    padding: "0 15px",
                    marging: "auto 0",
                    width: "auto",
                  }}
                >
                  <DateTimePicker
                    value={datePickerFromValue}
                    handleChange={handleFromTimeChange}
                    dateStyle="short"
                    timeStyle="short"
                  />
                </FormControl>
                <FormControl
                  sx={{
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
                  }}
                >
                  after user has entered audience state
                </FormControl>
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

  return (
    <>
      <Card
        sx={{
          padding: "30px",
          width: "100%",
        }}
      >
        <div className="rounded-[10px] border-[1px] border-[#D1D5DB] my-[25px] mx-[0px] py-[20px] px-[25px] relative shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center relative">
            <div className="rounded-[10px] my-[25px] mx-[0px] pt-[10px] pb-[25px] px-[20px] bg-[#F9F9FA] flex items-center cursor-pointer w-full">
              <div className="flex flex-[1] flex-wrap flex-col">
                <div className="w-full flex mb-[10px]">
                  <Select
                    onChange={(val) =>
                      setEventTrigger({ ...eventTrigger, providerType: val })
                    }
                    options={[
                      { value: ProviderTypes.Posthog, title: "Posthog" },
                      { value: ProviderTypes.Custom, title: "Custom" },
                    ]}
                    wrapperClassnames="max-w-[120px] mr-[15px]"
                    value={eventTrigger.providerType}
                  />
                  {eventTrigger.providerType === ProviderTypes.Posthog && (
                    <Select
                      onChange={(val) =>
                        setEventTrigger({
                          ...eventTrigger,
                          providerParams: val,
                        })
                      }
                      options={[
                        { value: PosthogTriggerParams.Track, title: "Track" },
                        { value: PosthogTriggerParams.Page, title: "Page" },
                        {
                          value: PosthogTriggerParams.Autocapture,
                          title: "Autocapture",
                        },
                      ]}
                      wrapperClassnames="max-w-[120px] w-full"
                      value={eventTrigger.providerParams}
                    />
                  )}
                </div>
                {triggerType === "eventBased" ? (
                  <>
                    <div>
                      {eventTrigger.properties?.conditions?.map(
                        (condition, i) => (
                          <>
                            <ConditionCreater
                              condition={condition}
                              onChange={(updatedCondition) =>
                                handleConditionsChange(i, updatedCondition)
                              }
                              onDelete={() => handleDeleteCondition(i)}
                              possibleTypes={possibleTypes}
                              isViewMode={isViewMode}
                              specificProvider={eventTrigger.providerType}
                            />
                            {i !==
                              (eventTrigger?.properties?.conditions?.length ||
                                0) -
                                1 && (
                              <div className="max-w-[7%]">
                                <AndOrSelect
                                  value={condition.relationWithNext}
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
              <div className="flex items-center gap-[15px]">
                <FormControl
                  sx={{
                    maxWidth: "135px",
                    paddingLeft: "15px",
                    minWidth: "112px",
                  }}
                >
                  <Select
                    id="activeJourney"
                    value={triggerType}
                    options={[{ value: "timeWindow", title: "To" }]}
                    onChange={handletriggerType}
                    displayEmpty
                    disabled={isViewMode}
                    customButtonClass={`${
                      isViewMode && "!bg-gray-200 !cursor-auto opacity-[0.7]"
                    }`}
                  />
                </FormControl>
              </div>
              <div className="flex items-center relative">
                <div className="rounded-[10px] my-[25px] mx-[0px] pt-[10px] pb-[25px] px-[20px] bg-[#F9F9FA] flex items-center cursor-pointer w-full">
                  <div className="flex flex-[1] flex-wrap">
                    {generateTriggerUI({ toPart: true })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {triggerType === "eventBased" ? (
          <span className="text-red-500">{eventBasedErrorMessage}</span>
        ) : (
          <></>
        )}
        {!isViewMode && (
          <div className="flex gap-[10px] justify-end">
            <div>
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
            <div data-savetriggerreator>
              <GenericButton
                onClick={handleSubmit}
                style={{
                  width: "200px",
                }}
                disabled={
                  triggerType === "eventBased"
                    ? !!eventBasedErrorMessage
                    : isButtonDisabled
                }
              >
                Save
              </GenericButton>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default TriggerCreater;
