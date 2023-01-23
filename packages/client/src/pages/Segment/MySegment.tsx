import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { FormControl } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { GenericButton, Input, Select } from "components/Elements";
import EventCard from "./../../components/EventCard";
import {
  createSegment,
  getConditions,
  getResources,
  getSegment,
  updateSegment,
} from "./SegmentHelpers";
import { ConditionalType } from "components/EventCard/EventCard";
import { toast } from "react-toastify";
import { Resource } from "pages/EmailBuilder/EmailBuilder";
import { AxiosError } from "axios";
import AlertBanner from "components/AlertBanner";

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

export interface FormDataItem {
  [key: string]: {
    value?: string;
    isRoot?: boolean;
    isDirty?: boolean;
    children: FormDataItem;
  };
}

export interface ISegmentFetch {
  id: string;
  inclusionCriteria: InclusionCriteria;
  isFreezed: boolean;
  name: string;
  resources: IResource;
}

export interface IResource {
  [key: string]: Resource;
}

interface ISegmentInclusion {
  onSubmit?: (id?: string) => void;
  defaultTitle?: string;
  workflowId: string;
  segmentId?: string;
  audienceName?: string;
  isCollapsible: boolean;
  onClose: () => void;
}

const MySegment = ({
  onSubmit,
  segmentId,
  defaultTitle,
}: ISegmentInclusion) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [segmentForm, setSegmentForm] = useState<ISegmentInclusionForm>({
    title: defaultTitle || "",
  });
  const [titleEdit, setTitleEdit] = useState<boolean>(false);
  const [subTitleOptions, setSubTitleOptions] = useState<ConditionalType>(
    ConditionalType.and
  );
  const [resources, setResources] = useState<IResource>({});
  const [formData, setFormData] = useState<FormDataItem[]>([]);
  const [, setElementHeight] = useState<Number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const attributeRequestBodyKeys = ["attribute", "condition", "value"];

  const populateFormData = (criteria: Condition[]) => {
    const parsedFormData: FormDataItem[] = [];

    for (let index = 0; index < criteria.length; index++) {
      let objToPush: FormDataItem = {
        conditions: {
          children: {},
          value: "",
        },
      };
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
    // if (segmentId === undefined) {
    //   return;
    // }
    (async () => {
      let data: ISegmentFetch | undefined = undefined;
      if (segmentId) {
        const { data: fetchedData } = await getSegment(segmentId);
        data = fetchedData;
      }

      setSegmentForm({
        ...segmentForm,
        title: data?.name || segmentForm.title,
      });
      if (data?.resources) {
        setResources(data.resources);
      } else {
        const conditionsResponse = await getConditions();
        setResources((e: IResource) => ({
          ...e,
          [conditionsResponse.id]: conditionsResponse,
        }));
      }
      // if (data.inclusionCriteria)
      //   if (data.inclusionCriteria.conditionalType != undefined)
      //     setSubTitleOptions(data.inclusionCriteria.conditionalType);
      populateFormData(data?.inclusionCriteria?.conditions || []);
    })();
  }, []);

  const getAllResources = async (id: string) => {
    const response = await getResources(id);
    return response;
  };

  useEffect(() => {
    setElementHeight(elementRef?.current?.clientHeight || 0);
  }, [elementRef]);

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
    formDataToUpdate: FormDataItem;
    id: string;
    value: string;
    response?: { data?: { id?: string } };
    rowIndex?: number;
    isRoot?: boolean;
  }) => {
    const updatedData = recursivelyUpdateFormData(
      formDataToUpdate,
      id,
      value,
      response?.data?.id || "",
      isRoot
    );
    const shouldAddRow = rowIndex === formData.length - 1;

    const tempData = [
      ...formData.slice(0, rowIndex),
      updatedData,
      ...formData.slice((rowIndex || 0) + 1),
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

  const updateEvent = async ({
    value,
    id,
    rowIndex,
    type,
    isRoot,
  }: {
    value: string;
    id: string;
    rowIndex?: number;
    type: string;
    isRoot?: boolean;
  }) => {
    const formDataToUpdate: FormDataItem = JSON.parse(
      JSON.stringify(formData[rowIndex || 0])
    );
    if (type === "select") {
      let response = {};
      const resourceId = value;
      getAllResources(resourceId)
        .then((resourceResponse) => {
          response = JSON.parse(JSON.stringify(resourceResponse));
          setResources((re) => ({
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

  const handleSegmentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSegmentForm({
      ...segmentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  const handleSubTitleOptions = (value: ConditionalType) => {
    setSubTitleOptions(value);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const filteredData = formData.filter((item, index) => index !== rowIndex);
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

  interface IConditionResult {
    [x: string]: IConditionResult | string | undefined;
  }

  const generateConditions = (obj: FormDataItem[string]) => {
    const result: IConditionResult = {};
    if (obj.children && Object.keys(obj.children).length && obj.value) {
      result[obj.value] = generateConditions(obj.children[obj.value]);
    } else {
      result.value = obj.value;
    }

    return result;
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const requestBody: InclusionCriteria = {
      conditionalType: subTitleOptions,
      conditions: [],
    };
    const generatedConditions: any = [];
    formData.forEach((item) => {
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

    setIsLoading(true);
    if (segmentId === undefined) {
      try {
        const { data } = await createSegment({
          name: segmentForm.title,
          inclusionCriteria: requestBody,
          resources,
        });

        if (data.id) segmentId = data.id;

        toast.success("Segment created.", {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } catch (err) {
        let message = "Unexpected error";
        if (err instanceof AxiosError)
          message =
            err.response?.data?.message?.[0] ||
            err.response?.data?.message ||
            message;
        toast.error(message, {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        return;
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        await updateSegment(segmentId, {
          name: segmentForm.title,
          inclusionCriteria: requestBody,
          resources,
        });

        toast.success("Segment updated.", {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } catch (err) {
        let message = "Unexpected error";
        if (err instanceof AxiosError)
          message =
            err.response?.data?.message?.[0] ||
            err.response?.data?.message ||
            message;
        toast.error(message, {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        return;
      } finally {
        setIsLoading(false);
      }
    }
    if (onSubmit) {
      onSubmit(segmentId);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-center items-start pt-[18px]">
        <div className="w-full overflow-visible relative ">
          <div className="flex items-start justify-between">
            {!titleEdit ? (
              <h3 className="flex items-center gap-[10px]">
                {segmentForm.title}
                <div onClick={handleTitleEdit} data-title-edit>
                  <EditIcon sx={{ fontSize: "25px", cursor: "pointer" }} />
                </div>
              </h3>
            ) : (
              <Input
                value={segmentForm.title}
                placeholder={"Enter segment title"}
                name="title"
                id="title"
                onChange={handleSegmentFormChange}
                onKeyDown={handleTitleEnter}
                onBlur={() => setTitleEdit(false)}
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
          </div>
          <div
            className="rounded-[10px] max-h-[60vh] overflow-y-scroll min-h-[200px] border-[1px] border-[#D1D5DB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] m-[25px_0px] p-[20px_25px]"
            ref={elementRef}
          >
            <div className="mb-[10px]">
              <AlertBanner
                title="Don't specify conditions is you want any user to be eligible to be enrolled in this journey"
                text=""
              />
            </div>
            <div className="relative after:absolute after:z-[1] after:top-[63px] after:bottom-[0px] after:ml-[45px] after:border-l-[2px] after:border-dashed after:h-full">
              <div className="relative z-[10000] flex items-center gap-[15px]">
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
                    options={[
                      { value: ConditionalType.and, title: "All" },
                      { value: ConditionalType.or, title: "Any" },
                    ]}
                    onChange={handleSubTitleOptions}
                    displayEmpty
                    wrapperClassnames="z-[100000]"
                  />
                </FormControl>
                <p className="text-[14px]">of the following conditions match</p>
              </div>

              <div className="ml-[88px]">
                {formData?.map((item, index) => {
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
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <GenericButton
              id="saveSegmentParams"
              onClick={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={{
                maxWidth: "200px",
              }}
            >
              Save
            </GenericButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySegment;
