import Button, { ButtonType } from "components/Elements/Buttonv2";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import UserIcon from "./icons/UserIcon";
import Input from "components/Elements/Inputv2";
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
}

const Personv2 = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const [personInfo, setPersonInfo] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersonInfo, setEditingPersonInfo] = useState<
    Record<string, any>
  >({});
  const [timeLine, setTimeLine] = useState<CustomerEventsResponse | undefined>(
    undefined
  );
  const [eventsData, setEventsData] = useState<EventObject[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isFirstRenderSave, setIsFirstRenderSave] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(PersonTab.OVERVIEW);

  const [possibleAttributes, setPossibleAttributes] = useState<Attribute[]>([]);
  const [attributeSearch, setAttributeSearch] = useState("");

  const loadPossibleKeys = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Date&type=DateTime&isArray=false`,
    });

    setPossibleAttributes(data);
  };

  const uploadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const { data: timelineData } =
        await ApiService.get<CustomerEventsResponse>({
          url: `/customers/${id}/events?page=${page}&pageSize=${pageSize}`,
        });
      setEventsData((prev) => [...prev, ...timelineData.data]);
      setTimeLine(timelineData);
    } catch (error) {
      toast.error("Error loading timeline");
    }
    setIsLoadingEvents(false);
  };

  /*
  useEffect(() => {
    uploadEvents();
  }, [page]);
  */

  useEffect(() => {
    (async () => {
      try {
        await loadPossibleKeys();
        const { data: personData } = await ApiService.get({
          url: "/customers/" + id,
        });

        setPersonInfo(personData);
        //uploadEvents();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setEditingPersonInfo(personInfo);
  }, [isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ApiService.put({ url: "/customers/" + id, options: personInfo });
    } catch (e) {
      let message = "Error while saving";
      if (e instanceof AxiosError) message = e.response?.data?.message;
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isFirstRenderSave) {
      setIsFirstRenderSave(false);
      return;
    }

    handleSave();
  }, [personInfo]);

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

  const notPosthogKeys = Object.keys(personInfoToShow).filter(
    (key) => !possibleAttributes.find((attr) => attr.key === key)?.isPosthog
  );

  const posthogKeys = Object.keys(personInfoToShow).filter(
    (key) => !!possibleAttributes.find((attr) => attr.key === key)?.isPosthog
  );

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
                <div className="text-[#4B5563] font-roboto">Id: {id}</div>
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
      </div>
      <div className="w-full h-[calc(100vh-188px)] p-5 flex gap-5">
        {currentTab === PersonTab.OVERVIEW ? (
          <>
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
                {notPosthogKeys
                  .map((key) => {
                    const foundAttribute = possibleAttributes.find(
                      (attr) => attr.key === key
                    );

                    return {
                      key,
                      type: foundAttribute?.type,
                      dateFormat: [
                        StatementValueType.DATE,
                        StatementValueType.DATE_TIME,
                      ].includes(foundAttribute?.type as StatementValueType)
                        ? foundAttribute?.dateFormat
                        : undefined,
                    };
                  })
                  .map(({ key, type, dateFormat }) =>
                    isEditing ? (
                      <div className="flex flex-col gap-[10px]" key={key}>
                        <div className="text-[#18181B]">
                          {key} ({type}){" "}
                          {dateFormat ? <>[{dateFormat}]</> : <></>}
                        </div>
                        <div className="flex gap-4 items-center">
                          <Input
                            className="w-full"
                            wrapperClassName="w-full"
                            value={personInfoToShow[key]}
                            onChange={(val) =>
                              setEditingPersonInfo({
                                ...editingPersonInfo,
                                [key]: val,
                              })
                            }
                            placeholder="Input value"
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
                          {key} ({type}){" "}
                          {dateFormat ? <>[{dateFormat}]</> : <></>}
                        </div>
                        <div>
                          {["object", "boolean"].includes(
                            typeof personInfoToShow[key]
                          )
                            ? JSON.stringify(personInfoToShow[key])
                            : personInfoToShow[key]}
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
                      [attr.key]: "",
                    });
                  }}
                  options={possibleAttributes
                    .filter(
                      (attr) =>
                        !Object.keys(editingPersonInfo).includes(attr.key) &&
                        attr.key.includes(attributeSearch)
                    )
                    .map((attr) => ({
                      key: attr,
                      title: attr.key,
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
                    <Button
                      type={ButtonType.PRIMARY}
                      onClick={() => {
                        setPersonInfo(editingPersonInfo);
                        setIsEditing(false);
                      }}
                    >
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

              {posthogKeys.length > 0 && (
                <>
                  <div className="h-[1px] w-full bg-[#E5E7EB]" />

                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-2 items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_17_1386)">
                          <path
                            d="M11.0395 9.28498H10.319C10.2627 9.28498 10.2159 9.33185 10.2159 9.3881V10.2158H1.78238V1.78096H10.2172V2.60864C10.2172 2.66489 10.2641 2.71176 10.3203 2.71176H11.0409C11.0971 2.71176 11.144 2.66623 11.144 2.60864V1.26668C11.144 1.039 10.9605 0.855515 10.7328 0.855515H1.26809C1.04042 0.855515 0.856934 1.039 0.856934 1.26668V10.7301C0.856934 10.9577 1.04042 11.1412 1.26809 11.1412H10.7315C10.9592 11.1412 11.1426 10.9577 11.1426 10.7301V9.3881C11.1426 9.33052 11.0958 9.28498 11.0395 9.28498ZM11.223 5.51623H7.01765V4.49837C7.01765 4.40864 6.91318 4.35775 6.84354 4.414L4.9431 5.914C4.93029 5.92402 4.91993 5.93683 4.91281 5.95144C4.90569 5.96606 4.90199 5.98211 4.90199 5.99837C4.90199 6.01463 4.90569 6.03068 4.91281 6.0453C4.91993 6.05992 4.93029 6.07273 4.9431 6.08275L6.84354 7.58275C6.91452 7.639 7.01765 7.5881 7.01765 7.49837V6.48052H11.223C11.2819 6.48052 11.3301 6.4323 11.3301 6.37337V5.62337C11.3301 5.56444 11.2819 5.51623 11.223 5.51623Z"
                            fill="#111827"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_17_1386">
                            <rect width="12" height="12" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className="text-[16px] font-semibold leading-[24px]">
                        From Posthog
                      </div>

                      {posthogKeys
                        .map((key) => {
                          const foundAttribute = possibleAttributes.find(
                            (attr) => attr.key === key
                          );

                          return {
                            key,
                            type: foundAttribute?.type,
                            dateFormat: [
                              StatementValueType.DATE,
                              StatementValueType.DATE_TIME,
                            ].includes(
                              foundAttribute?.type as StatementValueType
                            )
                              ? foundAttribute?.dateFormat
                              : undefined,
                          };
                        })
                        .map(({ key, type, dateFormat }) =>
                          isEditing ? (
                            <div className="flex flex-col gap-[10px]" key={key}>
                              <div className="text-[#18181B]">
                                {key} ({type}){" "}
                                {dateFormat ? <>[{dateFormat}]</> : <></>}
                              </div>
                              <div className="flex gap-4 items-center">
                                <Input
                                  className="w-full"
                                  wrapperClassName="w-full"
                                  value={personInfoToShow[key]}
                                  onChange={(val) =>
                                    setEditingPersonInfo({
                                      ...editingPersonInfo,
                                      [key]: val,
                                    })
                                  }
                                  placeholder="Input value"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="" key={key}>
                              <div className="text-[#6B7280] text-[12px] leading-[20px]">
                                {key} ({type}){" "}
                                {dateFormat ? <>[{dateFormat}]</> : <></>}
                              </div>
                              <div>
                                {["object", "boolean"].includes(
                                  typeof personInfoToShow[key]
                                )
                                  ? JSON.stringify(personInfoToShow[key])
                                  : personInfoToShow[key]}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </>
              )}
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
        ) : (
          <div className="w-full h-full bg-white rounded-lg p-5">
            <PeopleInJourneyTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default Personv2;
