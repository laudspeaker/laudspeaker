import React, { useState, useEffect } from "react";
import { Box, MenuItem, Typography, FormControl } from "@mui/material";
import { GenericButton, Select, Input } from "components/Elements";
import {
  getConditions,
  getResources,
  transformDataToUI,
} from "../../pages/Segment/SegmentHelpers";
import Card from "components/Cards/Card";
import {
  ISegmentInclusionForm,
  InclusionCriteria,
} from "pages/Segment/MySegment";
import EditIcon from "@mui/icons-material/Edit";
import DateTimePicker from "components/Elements/DateTimePicker";

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
  } = props;

  const getAllResources = async (id: any) => {
    const response = await getResources(id);
    return response;
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
    useState(new Date());

  const [datePickerFromValue, setDatePickerFromValue] = useState(new Date());

  const [datePickerToValue, setDatePickerToValue] = useState(new Date());

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleTimeDelayChange = (e: any) => {
    const arr: string[] = e.target.value.split(":");
    setIsButtonDisabled(!e.target.value.match(/\d\d:\d\d:\d\d/));
    if (
      arr.length > 3 ||
      (arr[0] && arr[0].length > 2) ||
      (arr[1] && arr[1].length > 2) ||
      (arr[2] && arr[2].length > 3) ||
      arr.some((part: string) => isNaN(+part)) ||
      +arr[0] > 59 ||
      +arr[1] > 23
    ) {
      return;
    }
    setDelayInputTime(e.target.value);
  };

  const handleTimeSelectChange = (e: any) => {
    setIsButtonDisabled(true);
    setEventTimeSelect(e.target.value);
  };

  const handletriggerType = (e: any) => {
    setTriggerType(e.target.value);
  };

  const handleSpecificTimeChange = (value: Date | null) => {
    setIsButtonDisabled(!value || value < new Date());
    if (value) setDatePickerSpecificTimeValue(value);
  };

  const handleToTimeChange = (value: Date | null) => {
    setIsButtonDisabled(
      !datePickerToValue ||
        !datePickerFromValue ||
        datePickerToValue < datePickerFromValue
    );
    if (value) setDatePickerToValue(value);
  };

  const handleFromTimeChange = (value: Date | null) => {
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
          !(trigger?.properties?.conditions as { value: string }[])?.some(
            (item) => item.value
          ) || false
        );
        setFormData(
          populateFormData(trigger?.properties?.conditions) || [
            {
              [response.id]: {
                value: "",
                isRoot: true,
                children: {},
              },
            },
          ]
        );
        trigger?.properties?.conditions?.forEach((item: any) => {
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
  }, [triggerType]);

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
    e,
    response,
    rowIndex,
    isRoot = false,
  }: any) => {
    const updatedData = recursivelyUpdateFormData(
      formDataToUpdate,
      id,
      e.target.value,
      response?.data?.id || "",
      isRoot
    );
    let shouldAddRow = false;
    for (const key in formData[formData.length - 1]) {
      if (
        !updatedData.isDirty &&
        (formData.length === 1 ||
          formData[formData.length - 1][key].value === "")
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
  const updateEvent = async ({ e, id, rowIndex, type, isRoot }: any) => {
    setIsButtonDisabled(true);
    const formDataToUpdate = JSON.parse(JSON.stringify(formData[rowIndex]));
    if (type === "select") {
      let response: any = {};
      const resourceId = e.target.value;
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
            e,
            response,
            rowIndex,
            isRoot,
          });
        });
    }
    if (type === "inputText" || type === "inputNumber") {
      setIsButtonDisabled(
        e.target.value === "" || e.target.value === undefined
      );
      updateFormData({
        formDataToUpdate,
        id,
        e,
        response: {},
        rowIndex,
      });
    }
    if (type === "dateRange" || type === "dateTime") {
      updateFormData({
        formDataToUpdate,
        id,
        e,
        response: {},
        rowIndex,
      });
    }
  };

  const handleEventBasedChange = ({ e, id: key, type, isRoot }: any) => {
    updateEvent({
      e,
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
    if (obj.children && Object.keys(obj.children).length) {
      result[obj.value] = generateConditions(obj.children[obj.value]);
    } else {
      result.value = obj.value;
    }

    return result;
  };
  const handleEventBasedTrigger: any = async (e: any) => {
    const requestBody: InclusionCriteria = {
      conditions: [],
    };
    const generatedConditions: any = [];
    formData.forEach((item: any) => {
      const conditions = generateConditions(item.conditions);
      const flattenedObj = flatten(conditions);
      const transformedObj: any = {};
      for (const key in flattenedObj) {
        const split = key.split(".");
        const [, ...rest] = split;
        for (let i = 0; i < rest.length - 1; i++) {
          transformedObj[attributeRequestBodyKeys[i]] = rest[i];
        }
        transformedObj.value = flattenedObj[key];
        transformedObj.type = item.conditions.value;
      }
      generatedConditions.push(transformedObj);
    });
    requestBody.conditions = generatedConditions;
    return requestBody;
  };

  const handleSubmit: any = async (e: any) => {
    e.preventDefault();
    if (triggerType == "timeDelay")
      onSave(JSON.parse(JSON.stringify(delayInputTime)));
    else if (triggerType == "timeWindow") onSave(timeWindow);
    else if (triggerType == "eventBased") {
      const eventBasedTriggerData = await handleEventBasedTrigger();
      onSave(eventBasedTriggerData);
    }
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
            <Box display={"flex"} alignItems={"center"}>
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
                  onChange={handleTimeSelectChange}
                  displayEmpty
                  sx={{
                    height: "44px",
                    "& .MuiSelect-select": {
                      padding: "9px 15px",
                      border: "1px solid #DEDEDE",
                      paddingRight: "50px !important",
                      boxShadow: "none",
                    },
                  }}
                >
                  <MenuItem value={"Delay"}>Delay</MenuItem>
                  <MenuItem value={"SpecificTime"}>Specific Time</MenuItem>
                </Select>
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
                          onChange: ({ e }: any) => handleTimeDelayChange(e),
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
            </Box>
          </>
        );
        break;
      }
      case "timeWindow": {
        jsx = (
          <Box display={"flex"} alignItems={"center"} flexDirection="column">
            {toPart ? (
              <Box display={"flex"} alignItems={"center"} marginTop={"10px"}>
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
              </Box>
            ) : (
              <Box display={"flex"} alignItems={"center"}>
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
              </Box>
            )}
          </Box>
        );
        break;
      }
      default:
        break;
    }
    return <>{jsx}</>;
  };
  return (
    <>
      {hasExitButton && (
        <button
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            border: "0px",
            background: "transparent",
            outline: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
          onClick={deleteRow}
        >
          x
        </button>
      )}
      <Card
        sx={{
          padding: "30px",
          width: "100%",
          maxWidth: "1138px",
        }}
      >
        <Box
          alignItems={"flex-start"}
          justifyContent={"space-between"}
          display={"flex"}
        >
          {!titleEdit ? (
            <Typography
              variant="h3"
              display={"flex"}
              alignItems="center"
              gap="10px"
            >
              {segmentForm.title}
              <EditIcon
                sx={{ fontSize: "25px", cursor: "pointer" }}
                onClick={handleTitleEdit}
              />
            </Typography>
          ) : (
            <Input
              value={segmentForm.title}
              placeholder={"Enter segment title"}
              name="title"
              id="title"
              onChange={handleSegmentFormChange}
              onKeyDown={handleTitleEnter}
              autoFocus
              inputProps={{
                style: {
                  padding: "0px",
                  background: "#fff",
                  fontFamily: "Inter",
                  fontWeight: "600",
                  fontSize: "25px",
                  color: "#28282E",
                },
              }}
            />
          )}
        </Box>
        <Box
          borderRadius={"10px"}
          border="1px solid #D1D5DB"
          boxShadow={"0px 1px 2px rgba(0, 0, 0, 0.05)"}
          margin="25px 0px"
          padding={"20px 25px"}
          position="relative"
        >
          <Box display={"flex"} alignItems="center" gap={"15px"}>
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
                onChange={handletriggerType}
                displayEmpty
                sx={{
                  height: "44px",
                  "& .MuiSelect-select": {
                    padding: "9px 15px",
                    border: "1px solid #DEDEDE",
                    boxShadow: "none",
                  },
                }}
              >
                {triggerType === "eventBased" && (
                  <MenuItem value={"eventBased"}>Conditions</MenuItem>
                )}
                {triggerType === "timeDelay" && (
                  <MenuItem value={"timeDelay"}>When</MenuItem>
                )}
                {triggerType === "timeWindow" && (
                  <MenuItem value={"timeWindow"}>From</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          <Box marginLeft="88px">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                "::after": {
                  content: "no-close-quote",
                  position: "absolute",
                  zIndex: 1,
                  top: "10%",
                  left: "-100px",
                  // left: "23.5%",
                  marginLeft: "45px",
                  borderLeft: "2px dashed #7B7E7C",
                  height: "80%",
                },
              }}
            >
              <Box
                sx={{
                  borderRadius: "10px",
                  margin: "25px 0px",
                  padding: "10px 25px 20px",
                  backgroundColor: "#F9F9FA",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <Box display={"flex"} flex={1} flexWrap={"wrap"}>
                  {generateTriggerUI()}
                </Box>
              </Box>
            </Box>
          </Box>
          {triggerType === "timeWindow" && (
            <>
              <Box display={"flex"} alignItems="center" gap={"15px"}>
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
                    onChange={handletriggerType}
                    displayEmpty
                    sx={{
                      height: "44px",
                      "& .MuiSelect-select": {
                        padding: "9px 15px",
                        border: "1px solid #DEDEDE",
                        boxShadow: "none",
                      },
                    }}
                  >
                    <MenuItem value={"timeWindow"}>To</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box marginLeft="88px">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    "::after": {
                      content: "no-close-quote",
                      position: "absolute",
                      zIndex: 1,
                      top: "10%",
                      left: "-100px",
                      // left: "23.5%",
                      marginLeft: "45px",
                      borderLeft: "2px dashed #7B7E7C",
                      height: "80%",
                    },
                  }}
                >
                  <Box
                    sx={{
                      borderRadius: "10px",
                      margin: "25px 0px",
                      padding: "10px 25px 20px",
                      backgroundColor: "#F9F9FA",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    <Box display={"flex"} flex={1} flexWrap={"wrap"}>
                      {generateTriggerUI({ toPart: true })}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Box>
        <Box display={"flex"} gap={10} justifyContent="flex-end">
          <Box>
            <GenericButton
              variant="contained"
              onClick={deleteRow}
              fullWidth
              sx={{
                maxWidth: "200px",
                background: "#D3D3D3",
                width: "200px",
                color: "#28282E",
              }}
            >
              Delete
            </GenericButton>
          </Box>
          <Box data-savetriggerreator>
            <GenericButton
              variant="contained"
              onClick={handleSubmit}
              fullWidth
              sx={{
                width: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
              disabled={isButtonDisabled}
            >
              Save
            </GenericButton>
          </Box>
        </Box>
      </Card>
    </>
  );
};

export default TriggerCreater;
