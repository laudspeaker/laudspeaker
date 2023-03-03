import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  KeyboardEvent,
  MouseEvent,
  FC,
} from "react";
import { FormControl } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import EventCard from "./../../components/EventCard";
import { ConditionalType } from "components/EventCard/EventCard";
import { toast } from "react-toastify";
import { Resource } from "pages/EmailBuilder/EmailBuilder";
import { AxiosError } from "axios";
import AlertBanner from "components/AlertBanner";
import ApiService from "services/api.service";
import {
  getFilterConditions,
  getResources,
} from "pages/Segment/SegmentHelpers";

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

interface FilterProps {
  onSubmit?: (id?: string) => void;
  defaultTitle?: string;
  workflowId: string;
  filterId?: string;
  audienceName?: string;
  isCollapsible: boolean;
  onClose: () => void;
}

const FilterBuilder: FC<FilterProps> = ({ onSubmit, filterId }) => {
  const elementRef = useRef<HTMLDivElement>(null);
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

      if (criteria[index].condition === "memberof") {
        objToPush = {
          conditions: {
            value: "memberof",
            isRoot: true,
            children: {
              memberof: {
                value: criteria[index].value,
                children: {},
              },
            },
            isDirty: true,
          },
        };
      } else if (criteria[index].condition) {
        objToPush = {
          conditions: {
            value: "filteron",
            isRoot: true,
            children: {
              filteron: {
                value: "attributes",
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
              },
            },
            isDirty: true,
          },
        };
      } else {
        objToPush = {
          conditions: {
            value: "filteron",
            isRoot: true,
            children: {
              filteron: {
                value: "attributes",
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
    (async () => {
      let data: ISegmentFetch | undefined = undefined;
      if (filterId) {
        const { data: fetchedData } = await ApiService.get({
          url: "/filter/" + filterId,
        });
        data = fetchedData;
      }

      if (data?.resources) {
        setResources(data.resources);
      } else {
        const conditionsResponse = await getFilterConditions();
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
    console.log(formData);
    formData.forEach((item) => {
      if (item.conditions.value === "filteron") {
        const conditions = generateConditions(
          item.conditions.children.filteron
        );
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
      if (item.conditions.value === "memberof") {
        generatedConditions.push({
          condition: "memberof",
          value: item.conditions.children.memberof.value,
        });
      }
    });

    requestBody.conditions = generatedConditions;

    setIsLoading(true);
    if (filterId === undefined) {
      try {
        const { data } = await ApiService.post({
          url: "/filter",
          options: {
            inclusionCriteria: requestBody,
            resources,
          },
        });

        if (data.id) filterId = data.id;
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
        await ApiService.patch({
          url: "/filter/" + filterId,
          options: {
            inclusionCriteria: requestBody,
            resources,
          },
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
      onSubmit(filterId);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-center items-start pt-[18px]">
        <div className="w-full overflow-visible relative ">
          <div
            className="rounded-[10px] max-h-[60vh] overflow-y-scroll min-h-[200px] border-[1px] border-[#D1D5DB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] m-[25px_0px] p-[20px_25px]"
            ref={elementRef}
          >
            <div className="mb-[10px]">
              <AlertBanner title="Don't specify conditions is you want any user to be eligible to be enrolled in this journey" />
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

export default FilterBuilder;
