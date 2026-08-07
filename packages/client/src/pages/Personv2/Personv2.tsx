import Button, { ButtonType } from "components/Elements/Buttonv2";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import UserIcon from "./icons/UserIcon";
import TrashIcon from "../../assets/icons/TrashIcon";
import Progress from "components/Progress";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import { ApiConfig } from "../../constants";
import { useNavigate } from "react-router-dom";
import PeopleInJourneyTable from "components/PeopleInJourneyTable";
import Scrollbars from "react-custom-scrollbars-2";
import { format } from "date-fns";
import { capitalize } from "lodash";
import { ChevronDoubleDownIcon } from "@heroicons/react/20/solid";
import { Attribute } from "pages/PeopleSettings/PeopleSettings";
import Select from "components/Elements/Selectv2";
import { StatementValueType } from "reducers/flow-builder.reducer";
import DynamicInput from "pages/FlowBuilderv2/Elements/DynamicInput";
import { Segment } from "types/Segment";
import Table from "components/Tablev2";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";
import { AttributeType } from "pages/PeopleSettings/PeopleSettings";

export interface EventObject {
  event: string;
  stepId: string;
  createdAt: string;
  templateId: string;
  journeyName: string;
  templateName: string;
  templateType: string;
  eventProvider: string;
}

interface CustomerEventsResponse {
  data: EventObject[];
  page: number;
  pageSize: number;
  totalPage: number;
  totalCount: number;
}

enum PersonTab {
  OVERVIEW = "Overview",
  JOURNEY = "Journey",
  SEGMENTS = "Segments",
}

interface SegmentRowData {
  id: string;
  name: string;
  type: string;
  lastUpdate: string;
}

enum SortProperty {
  UPDATED_AT = "updatedAt",
}

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
}

function validateType(value: any, type: any) {
  switch (type) {
    case "Number":
      return !isNaN(+value) && isFinite(+value);
    case "String":
      return typeof value === "string";
    case "Date":
    case "DateTime":
      // Example of date validation; implement as needed
      return !isNaN(Date.parse(value));
    case "Boolean":
      // Considering boolean input as string 'true' or 'false'
      return value === true || value === false;
    // Add other type validations as needed
    case "Email":
      // Simple email validation using regex
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(value);
    default:
      return false;
  }
}

function enforceType(value: any, type: AttributeType) {
  switch (type.name as StatementValueType) {
    case StatementValueType.NUMBER:
      return Number(value);
    case StatementValueType.STRING:
      return String(value);
    case StatementValueType.DATE:
    case StatementValueType.DATE_TIME:
      // Assuming the value is in a format that can be parsed by the Date constructor
      return new Date(value);
    // Add more cases as needed for other types
    default:
      return value;
  }
}

export const generateAttributeView = (
  value: any,
  type: AttributeType,
  isArray?: boolean,
  dateFormat?: string
): ReactNode => {
  if (isArray) {
    return (value as any[])
      .map((item) => generateAttributeView(item, type, false, dateFormat))
      .join(", ");
  }

  switch (type.name as StatementValueType) {
    case StatementValueType.BOOLEAN:
      return value ? "true" : "false";
      break;
    case StatementValueType.DATE:
    case StatementValueType.DATE_TIME:
      return value && dateFormat ? format(new Date(value), dateFormat) : value;
    default:
      return value;
  }
};

const Personv2 = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const [personInfo, setPersonInfo] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersonInfo, setEditingPersonInfo] = useState<
    Record<string, any>
  >({});
  // Add validationErrors state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | null>
  >({});

  const [timeLine, setTimeLine] = useState<CustomerEventsResponse | undefined>(
    undefined
  );
  const [eventsData, setEventsData] = useState<EventObject[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  //segments state

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [rows, setRows] = useState<SegmentRowData[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.UPDATED_AT,
    sortType: SortType.DESC,
  });
  const [search, setSearch] = useState("");

  //

  const [isFirstRenderSave, setIsFirstRenderSave] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(PersonTab.OVERVIEW);

  const [possibleAttributes, setPossibleAttributes] = useState<Attribute[]>([]);
  const [attributeSearch, setAttributeSearch] = useState("");
  const [possibleAttributeTypes, setPossibleAttributeTypes] = useState<
    AttributeType[]
  >([]);

  const attributesToShow = useMemo(
    () => [...possibleAttributes],
    [possibleAttributes]
  );

  const loadPossibleKeys = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Boolean&type=Date&type=DateTime`,
    });

    setPossibleAttributes(data);
  };

  const loadKeyTypes = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attribute-types`,
    });

    setPossibleAttributeTypes(data);
  };

  const loadSegmentData = async () => {
    setIsLoadingSegments(true);
    try {
      const {
        data: { data, totalPages },
      } = await ApiService.get<{
        data: Segment[];
        totalPages: number;
      }>({
        url: `/segments/person/${id}?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&search=${search}&orderBy=${sortOptions.sortBy}&orderType=${
          sortOptions.sortType
        }`,
      });

      /*({
        url: `/segments?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&search=${search}&orderBy=${sortOptions.sortBy}&orderType=${
          sortOptions.sortType
        }`,
      });
      */

      setRows(
        data.map((segment) => ({
          id: segment.id,
          name: segment.name,
          type: segment.type,
          lastUpdate: new Date().toUTCString(),
        }))
      );
      setPagesCount(totalPages);
      setIsLoaded(true);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSegmentData();
  }, [currentPage, sortOptions]);

  const loadData = async () => {
    try {
      await loadPossibleKeys();
      const { data: personData } = await ApiService.get({
        url: "/customers/" + id,
      });

      setPersonInfo(personData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeyTypes();
    loadData();
  }, []);

  useEffect(() => {
    setEditingPersonInfo(personInfo);
  }, [isEditing]);

  const validateAllFields = () => {
    let allValid = true;
    const newValidationErrors: Record<string, string> = {};
    const skipValidationFor = [
      "createdAt",
      "isAnonymous",
      "iosDeviceToken",
      "androidToken",
      "other_ids",
      "iosDeviceTokenSetAt",
      "androidDeviceTokenSetAt",
      "null",
    ];

    // Iterate over user attributes directly
    Object.entries(editingPersonInfo.user_attributes || {}).forEach(
      ([key, value]) => {
        if (skipValidationFor.includes(key)) {
          return; // skip if needed
        }

        const foundAttribute = attributesToShow.find(
          (attr) => attr.name === key
        );
        if (!foundAttribute) {
          // If we can't find the attribute, consider skipping or handle as invalid
          return;
        }

        const isValid =
          foundAttribute.attribute_type.name === "Array"
            ? (value as any[]).every((item) =>
                validateType(item, foundAttribute?.attribute_subtype?.name)
              )
            : validateType(value, foundAttribute?.attribute_type.name);

        if (!isValid) {
          allValid = false;
          newValidationErrors[
            key
          ] = `Value must be a ${foundAttribute?.attribute_type.name}`;
        }
      }
    );

    setValidationErrors(newValidationErrors);
    return allValid;
  };

  const handleSave = async () => {
    const allFieldsValid = validateAllFields();
    if (!allFieldsValid) {
      toast.error(
        "Cannot save - make sure the data you entered matches the type."
      );
      return;
    }

    const enforcedUserAttributes = Object.entries(
      editingPersonInfo.user_attributes || {}
    ).reduce<Record<string, any>>((acc, [key, value]) => {
      if (key === "createdAt") {
        acc[key] = value;
      } else {
        const foundAttribute = attributesToShow.find(
          (attr) => attr.name === key
        );
        if (foundAttribute) {
          acc[key] =
            foundAttribute.attribute_type.name === "Array"
              ? (value as any[]).map((item) =>
                  enforceType(
                    item,
                    foundAttribute?.attribute_subtype ||
                      possibleAttributeTypes[0]
                  )
                )
              : enforceType(value, foundAttribute.attribute_type);
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    const enforcedData = {
      ...editingPersonInfo,
      user_attributes: enforcedUserAttributes,
    };

    setIsSaving(true);
    try {
      await ApiService.put({
        url: "/customers/" + id,
        options: enforcedData,
      });
      setIsEditing(false);
      await loadData();
    } catch (e) {
      let message = "Error while saving";
      if (e instanceof AxiosError && e.response) {
        message = e.response.data.message || message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePerson = () => {
    confirmAlert({
      title: "Confirm delete?",
      message: "Are you sure you want to delete this person?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsSaving(true);
            try {
              await ApiService.post({
                url: ApiConfig.customerDelete + id,
                options: {},
              });
              navigate("/people");
            } catch (e) {
              let message = "Error while deleting";
              if (e instanceof AxiosError) message = e.response?.data?.message;
              toast.error(message);
            } finally {
              setIsSaving(false);
            }
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  const personInfoToShow = isEditing ? editingPersonInfo : personInfo;

  const user_attributes = Object.keys(personInfoToShow?.user_attributes || {});
  const system_attributes = Object.keys(
    personInfoToShow?.system_attributes || {}
  );

  if (
    Array.isArray(personInfoToShow?.other_ids) &&
    personInfoToShow?.other_ids.length > 0 &&
    !system_attributes.includes("other_ids")
  ) {
    system_attributes.push("other_ids");

    personInfoToShow.system_attributes ||= {};

    personInfoToShow.system_attributes.other_ids = personInfoToShow?.other_ids;
  }

  if (isLoading) return <Progress />;

  return (
    <div className="w-full font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="h-[96px] w-full bg-white border-t-[1px] border-[#E5E7EB] px-5 flex justify-between items-center">
        <div className="flex items-center gap-[10px]">
          {isEditing ? (
            <div className="text-[20px] font-semibold leading-[28px]">
              Edit attributes
            </div>
          ) : (
            <>
              <UserIcon />
              <div className="flex flex-col gap-[5px]">
                <div className="text-[20px] font-semibold leading-[28px]">
                  {personInfo.email}
                </div>
                <div className="text-[#4B5563] font-roboto">
                  Id: <span id="personId">{id}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <Button type={ButtonType.DANGEROUS} onClick={handleDeletePerson}>
          Delete
        </Button>
      </div>
      <div className="w-full h-[46px] bg-white px-5 flex gap-[32px] text-[#000000D9] font-roboto">
        <button
          className={`border-[#4338CA] ${
            currentTab === PersonTab.OVERVIEW ? "border-b-2 text-[#4338CA]" : ""
          }`}
          onClick={() => setCurrentTab(PersonTab.OVERVIEW)}
        >
          Overview
        </button>
        <button
          className={`border-[#4338CA] ${
            currentTab === PersonTab.JOURNEY ? "border-b-2 text-[#4338CA]" : ""
          }`}
          onClick={() => setCurrentTab(PersonTab.JOURNEY)}
        >
          Journeys
        </button>
        <button
          className={`border-[#4338CA] ${
            currentTab === PersonTab.SEGMENTS ? "border-b-2 text-[#4338CA]" : ""
          }`}
          onClick={() => setCurrentTab(PersonTab.SEGMENTS)}
        >
          Segments
        </button>
      </div>
      <div className="w-full h-[calc(100vh-188px)] p-5 flex gap-5">
        {currentTab === PersonTab.OVERVIEW ? (
          <>
            <div className="w-full flex flex-col gap-5">
              <div className="w-full h-fit bg-white rounded-lg p-5 flex flex-col gap-5">
                <div className="w-full flex justify-between">
                  {!isEditing && (
                    <div className="text-[20px] font-semibold leading-[28px]">
                      Attributes
                    </div>
                  )}

                  {!isEditing && (
                    <Button
                      type={ButtonType.SECONDARY}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                <div
                  className={`w-full grid grid-cols-2 ${
                    isEditing ? "gap-y-[20px] gap-x-[60px]" : "gap-y-[10px]"
                  }`}
                >
                  {user_attributes
                    .map((key) => {
                      const foundAttribute = attributesToShow.find(
                        (attr) => attr.name === key
                      );
                      return {
                        key,
                        type:
                          foundAttribute?.attribute_type.name ||
                          StatementValueType.STRING,
                        isArray:
                          foundAttribute?.attribute_type.subtype_required ||
                          false,
                        dateFormat: [
                          StatementValueType.DATE,
                          StatementValueType.DATE_TIME,
                        ].includes(
                          foundAttribute?.attribute_type
                            .name as StatementValueType
                        )
                          ? foundAttribute?.attribute_parameter
                          : undefined,
                      };
                    })
                    .map(({ key, type, isArray, dateFormat }) =>
                      isEditing ? (
                        <div className="flex flex-col gap-[10px]" key={key}>
                          <div className="text-[#18181B]">
                            {key} ({type}
                            {isArray ? "[]" : ""}){" "}
                            {dateFormat ? <>[{dateFormat}]</> : <></>}
                          </div>
                          <div className="flex gap-4 items-center">
                            <DynamicInput
                              type={
                                possibleAttributeTypes.find((possibleType) => {
                                  return possibleType.name === type;
                                }) || possibleAttributeTypes[0]
                              }
                              isArray={isArray}
                              value={editingPersonInfo.user_attributes[key]}
                              onChange={(value) => {
                                setEditingPersonInfo({
                                  ...editingPersonInfo,
                                  user_attributes: {
                                    ...editingPersonInfo.user_attributes,
                                    [key]: value,
                                  },
                                });
                              }}
                              placeholder="Input value"
                              dateFormat={dateFormat as unknown as string}
                            />
                            <button
                              onClick={() => {
                                const newEditingPersonInfo = {
                                  ...editingPersonInfo,
                                };
                                delete newEditingPersonInfo[key];
                                setEditingPersonInfo(newEditingPersonInfo);
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="" key={key}>
                          <div className="text-[#6B7280] text-[12px] leading-[20px]">
                            {key} ({type}
                            {isArray ? "[]" : ""}){" "}
                            {dateFormat ? <>[{dateFormat}]</> : <></>}
                          </div>
                          <div>
                            {generateAttributeView(
                              personInfoToShow.user_attributes[key],
                              possibleAttributeTypes.find((possibleType) => {
                                return possibleType.name === type;
                              }) || possibleAttributeTypes[0],
                              isArray,
                              dateFormat as unknown as string
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
                {isEditing && (
                  <Select<Attribute | undefined>
                    buttonClassName="!w-fit"
                    value={undefined}
                    onChange={(attr) => {
                      if (!attr) return;
                      setEditingPersonInfo({
                        ...editingPersonInfo,
                        user_attributes: {
                          ...editingPersonInfo.user_attributes,
                          [attr.name]: attr.attribute_type.subtype_required
                            ? []
                            : "",
                        },
                      });
                    }}
                    options={possibleAttributes
                      .filter(
                        (attr) =>
                          !Object.keys(editingPersonInfo).includes(attr.name) &&
                          attr.name.includes(attributeSearch)
                      )
                      .map((attr) => ({
                        key: attr,
                        title: attr.name,
                      }))}
                    customBTN={
                      <Button type={ButtonType.SECONDARY} onClick={() => {}}>
                        <div className="flex gap-2 items-center">
                          <div>Add attribute</div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M6.33719 9.39777L11.0528 3.36027C11.0652 3.34449 11.073 3.32553 11.0751 3.30557C11.0772 3.2856 11.0737 3.26544 11.0649 3.2474C11.056 3.22936 11.0423 3.21417 11.0253 3.20357C11.0082 3.19298 10.9885 3.18741 10.9684 3.1875H9.93317C9.86754 3.1875 9.8046 3.2183 9.76442 3.2692L5.99969 8.09063L2.23495 3.2692C2.19478 3.21697 2.13183 3.1875 2.0662 3.1875H1.03094C0.941204 3.1875 0.89165 3.29063 0.946561 3.36027L5.66219 9.39777C5.70221 9.44908 5.75342 9.4906 5.8119 9.51915C5.87038 9.5477 5.93461 9.56254 5.99969 9.56254C6.06477 9.56254 6.12899 9.5477 6.18747 9.51915C6.24596 9.4906 6.29716 9.44908 6.33719 9.39777Z"
                              fill="#6366F1"
                            />
                          </svg>
                        </div>
                      </Button>
                    }
                    searchPlaceholder="Find an attribute"
                    searchValue={attributeSearch}
                    onSearchValueChange={setAttributeSearch}
                    placeholder="Add attribute"
                  />
                )}
                {isEditing && (
                  <>
                    <div className="h-[1px] w-full bg-[#E5E7EB]" />
                    <div className="flex gap-[10px]">
                      <Button type={ButtonType.PRIMARY} onClick={handleSave}>
                        Save
                      </Button>
                      <Button
                        type={ButtonType.SECONDARY}
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <div className="w-full h-fit bg-white rounded-lg p-5 flex flex-col gap-5">
                <div className="text-[20px] font-semibold leading-[28px]">
                  System Attributes
                </div>

                <div className="w-full grid grid-cols-2">
                  {system_attributes
                    .map((key) => {
                      const foundAttribute = attributesToShow.find(
                        (attr) => attr.name === key
                      );
                      return {
                        key,
                        type:
                          foundAttribute?.attribute_type.name ||
                          StatementValueType.STRING,
                        isArray:
                          foundAttribute?.attribute_type.parameters_required ||
                          false,
                        dateFormat: [
                          StatementValueType.DATE,
                          StatementValueType.DATE_TIME,
                        ].includes(
                          foundAttribute?.attribute_type
                            .name as StatementValueType
                        )
                          ? foundAttribute?.attribute_parameter
                          : undefined,
                      };
                    })
                    .map(({ key, type, isArray, dateFormat }, i) => (
                      <div className="" key={key}>
                        <div className="text-[#6B7280] text-[12px] leading-[20px]">
                          {key} ({type}
                          {isArray ? "[]" : ""}){" "}
                          {dateFormat ? <>[{dateFormat}]</> : <></>}
                        </div>
                        <div>
                          {generateAttributeView(
                            personInfoToShow.system_attributes[key],
                            possibleAttributeTypes.find((possibleType) => {
                              return possibleType.name === type;
                            }) || possibleAttributeTypes[0],
                            isArray,
                            dateFormat as unknown as string
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {!isEditing && eventsData.length > 0 && (
              <div className="w-[420px] h-full bg-white rounded-lg p-5 flex flex-col gap-5">
                <span className="text-[#111827] font-inter text-[20px] leading-[28px] font-semibold">
                  Timeline
                </span>
                <Scrollbars>
                  <div className="flex flex-col w-full">
                    {eventsData.map((el, i) => (
                      <div className="w-full h-[74px] flex">
                        <div className="w-[22px] mr-[10px] relative">
                          <div className="w-[2px] bg-[#0000000F] h-[6px] left-[10px] absolute" />
                          <div className="w-[10px] absolute top-[6px] left-[6px] h-[10px] rounded-full border-2 border-[#6366F1]" />
                          {(i + 1 !== eventsData.length ||
                            timeLine?.totalPage === timeLine?.page) && (
                            <div className="w-[2px] bg-[#0000000F] h-[58px] top-[16px] left-[10px] top absolute" />
                          )}
                        </div>
                        <div className="flex flex-col text-[#111827]">
                          <div className="max-w-[230px] text-base font-semibold font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                            {capitalize(el.event)} {el.templateType}-
                            {el.templateName}
                          </div>
                          <div className="max-w-[230px] text-[14px] leading-[22px] font-normal font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                            Journey: {el.journeyName}
                          </div>
                          <div className="max-w-[230px] text-[12px] leading-5 font-normal font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                            {format(new Date(el.createdAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        </div>
                      </div>
                    ))}
                    {timeLine?.totalPage !== timeLine?.page && (
                      <button
                        className="flex w-full justify-center items-center text-[#6366F1] font-inter mb-[6px] font-semibold disabled:grayscale disabled:opacity-70"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={isLoadingEvents}
                      >
                        <ChevronDoubleDownIcon className="w-[16px] mx-[6px] animate-bounce" />
                        See more
                        <ChevronDoubleDownIcon className="w-[16px] mx-[6px] animate-bounce" />
                      </button>
                    )}
                    <div className="w-full h-[50px] flex">
                      <div className="w-[22px] mr-[10px] relative">
                        {timeLine?.totalPage === timeLine?.page && (
                          <div className="w-[2px] bg-[#0000000F] h-[6px] left-[10px] absolute" />
                        )}
                        <div className="w-[10px] absolute top-[6px] left-[6px] h-[10px] rounded-full border-2 border-[#6366F1] bg-[#6366F1]" />
                      </div>
                      <div className="flex flex-col text-[#111827]">
                        <div className="max-w-[230px] text-base font-semibold font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                          Created in Laudspeaker
                        </div>
                        <div className="max-w-[230px] text-[12px] leading-5 font-normal font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                          {format(
                            new Date(personInfo.createdAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Scrollbars>
              </div>
            )}
          </>
        ) : currentTab === PersonTab.JOURNEY ? (
          <div className="w-full h-full bg-white rounded-lg p-5">
            <PeopleInJourneyTable />
          </div>
        ) : currentTab === PersonTab.SEGMENTS ? (
          <div className="w-full h-full bg-white rounded-lg p-5 rounded-lg flex flex-col gap-10">
            {/* Segments tab content here */}
            <Table
              isLoading={isLoading}
              headings={[
                <div className="pr-30 py-[10px] select-none">Segment Name</div>,
                <div className="px-5 py-[10px] select-none">Type</div>,
                <div
                  className="px-5 py-[10px] select-none flex gap-[2px] items-center cursor-pointer"
                  onClick={() => {
                    if (sortOptions.sortBy !== SortProperty.UPDATED_AT) {
                      setSortOptions({
                        sortBy: SortProperty.UPDATED_AT,
                        sortType: SortType.DESC,
                      });

                      return;
                    }

                    if (sortOptions.sortType === SortType.ASC) {
                      setSortOptions({
                        sortBy: SortProperty.UPDATED_AT,
                        sortType: SortType.DESC,
                      });

                      return;
                    }

                    setSortOptions({
                      sortBy: SortProperty.UPDATED_AT,
                      sortType: SortType.ASC,
                    });
                  }}
                >
                  <div>Last update</div>
                  <div>
                    <img
                      src={
                        sortOptions.sortBy === SortProperty.UPDATED_AT
                          ? sortOptions.sortType === SortType.ASC
                            ? sortAscChevronsImage
                            : sortDescChevronsImage
                          : sortNoneChevronsImage
                      }
                    />
                  </div>
                </div>,
                ,
                <div className="px-5 py-[10px] select-none"></div>,
              ]}
              rowsData={rows}
              rows={rows.map((row) => [
                <button
                  className="text-[#6366F1]"
                  onClick={() => navigate(`/segment/${row.id}`)}
                >
                  {row.name}
                </button>,
                <div>{row.type}</div>,
                <div>
                  {format(new Date(row.lastUpdate), "MM/dd/yyyy HH:mm")}
                </div>,
              ])}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Personv2;
