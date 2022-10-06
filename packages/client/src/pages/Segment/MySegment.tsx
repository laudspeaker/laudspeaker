import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Box, FormControl, MenuItem, Typography } from "@mui/material";
import Card from "components/Cards/Card";
import EditIcon from "@mui/icons-material/Edit";
import { GenericButton, Input, Select } from "components/Elements";
import EventCard from "./../../components/EventCard";
import {
  getConditions,
  getResources,
  getSegment,
  updateSegment,
} from "./SegmentHelpers";
import { ConditionalType } from "components/EventCard/EventCard";

interface Condition {
  attribute: string;
  condition?: string;
  value: string;
}

export interface ISegmentInclusionForm {
  title: string;
  criteria?: InclusionCriteria;
}

export interface InclusionCriteria {
  conditionalType?: ConditionalType;
  conditions: Condition[];
}

interface ISegmentInclusion {
  onSubmit?: () => void;
  audienceId: string;
  audienceName?: string;
  isCollapsible: boolean;
  onClose: () => void;
}

const MySegment = ({
  onSubmit,
  audienceId,
  audienceName,
  onClose,
  isCollapsible,
}: ISegmentInclusion) => {
  const elementRef = useRef<any>(null);
  const [segmentForm, setSegmentForm] = useState<ISegmentInclusionForm>({
    title: "My Segment",
  });
  const [titleEdit, setTitleEdit] = useState<boolean>(false);
  const [subTitleOptions, setSubTitleOptions] = useState<ConditionalType>(
    ConditionalType.and
  );
  const [resources, setResouces] = useState<any>({});
  const [formData, setFormData] = useState<any[]>([]);
  const [, setElementHeight] = useState<Number>(0);

  const attributeRequestBodyKeys = ["attribute", "condition", "value"];

  const populateFormData: any = (criteria: Condition[]) => {
    const parsedFormData = [];
    for (let index = 0; index < criteria.length; index++) {
      let objToPush = {};
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
      parsedFormData.push(objToPush);
    }
    parsedFormData.push({
      conditions: {
        value: "",
        isRoot: true,
        children: {},
      },
    });
    setFormData(parsedFormData);
  };

  useLayoutEffect(() => {
    const getAllConditions = async () => {
      const { data } = await getSegment(audienceId);
      if (data.resources) {
        setResouces(data.resources);
      } else {
        const conditionsResponse = await getConditions();
        setResouces((e: any) => ({
          ...e,
          [conditionsResponse.id]: conditionsResponse,
        }));
      }
      if (data.inclusionCriteria)
        if (data.inclusionCriteria.conditionalType != undefined)
          setSubTitleOptions(data.inclusionCriteria.conditionalType);
      populateFormData(data.inclusionCriteria.conditions);
    };
    getAllConditions();
  }, []);

  const getAllResources = async (id: any) => {
    const response = await getResources(id);
    return response;
  };

  useEffect(() => {
    setElementHeight(elementRef?.current?.clientHeight);
  }, [elementRef]);

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

  //useEffect(() => {}, [formData]);

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
    const shouldAddRow = rowIndex === formData.length - 1;

    const tempData = [
      ...formData.slice(0, rowIndex),
      updatedData,
      ...formData.slice(rowIndex + 1),
    ];
    if (isRoot === true && shouldAddRow) {
      tempData.push({
        [id]: {
          value: "",
          isRoot: true,
          children: {},
        },
      });
    }
    setFormData(tempData);
  };

  const updateEvent = async ({ e, id, rowIndex, type, isRoot }: any) => {
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

  const handleSegmentFormChange = (e: any) => {
    setSegmentForm({
      ...segmentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  const handleSubTitleOptions = (e: any) => {
    setSubTitleOptions(e.target.value);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const filteredData = formData.filter(
      (item: any, index: number) => index !== rowIndex
    );
    setFormData(filteredData);
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

  const handleSubmit: any = async (e: any) => {
    e.preventDefault();
    const requestBody: InclusionCriteria = {
      conditionalType: subTitleOptions,
      conditions: [],
    };
    const generatedConditions: any = [];
    formData.forEach((item: any) => {
      if (item.conditions.value === "attributes") {
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
        }
        generatedConditions.push(transformedObj);
      }
    });
    requestBody.conditions = generatedConditions;
    await updateSegment(audienceId, {
      inclusionCriteria: requestBody,
      id: audienceId,
      resources: resources,
    });
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <Box>
      <Box
        alignItems={"flex-start"}
        justifyContent={"center"}
        display={"flex"}
        paddingTop={"18px"}
      >
        <Card
          sx={{
            padding: "30px",
            width: "100%",
            maxWidth: "1138px",
            position: "relative",
          }}
        >
          {isCollapsible && (
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
              onClick={onClose}
            >
              x
            </button>
          )}
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
            <FormControl
              sx={{ maxWidth: "135px", paddingLeft: "15px", minWidth: "112px" }}
            ></FormControl>
          </Box>
          <Box
            borderRadius={"10px"}
            border="1px solid #D1D5DB"
            boxShadow={"0px 1px 2px rgba(0, 0, 0, 0.05)"}
            margin="25px 0px"
            padding={"20px 25px"}
            position="relative"
            sx={{
              "::after": {
                content: "no-close-quote",
                position: "absolute",
                zIndex: 1,
                top: "63px",
                bottom: "0px",
                // left: "23.5%",
                marginLeft: "45px",
                borderLeft: "2px dashed #7B7E7C",
                height: "calc(100% - 140px)",
              },
            }}
            ref={elementRef}
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
                  value={subTitleOptions}
                  onChange={handleSubTitleOptions}
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
                  <MenuItem value={ConditionalType.and}>All</MenuItem>
                  <MenuItem value={ConditionalType.or}>Any</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="subtitle2" fontSize={"14px"}>
                of the following conditions match
              </Typography>
            </Box>

            <Box marginLeft="88px">
              {formData?.map((item: any, index: number) => {
                let canDeleteRow = false;
                for (const key in item) {
                  if (item[key]?.value) {
                    canDeleteRow = true;
                  }
                }
                return (
                  <>
                    <EventCard
                      updateFormData={updateEvent}
                      key={index}
                      formData={item}
                      id={index}
                      canDeleteRow={canDeleteRow}
                      resources={resources}
                      handleDeleteRow={handleDeleteRow}
                      rowLength={formData?.length}
                      conditionType={subTitleOptions}
                    />
                  </>
                );
              })}
            </Box>
          </Box>
          <Box display={"flex"} justifyContent="flex-end">
            <GenericButton
              variant="contained"
              onClick={handleSubmit}
              fullWidth
              sx={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Save
            </GenericButton>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default MySegment;
