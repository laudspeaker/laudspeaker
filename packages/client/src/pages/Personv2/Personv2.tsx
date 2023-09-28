import Button, { ButtonType } from "components/Elements/Buttonv2";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import UserIcon from "./icons/UserIcon";
import Input from "components/Elements/Inputv2";
import TrashIcon from "./icons/TrashIcon";
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
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
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

  useEffect(() => {
    uploadEvents();
  }, [page]);

  useEffect(() => {
    (async () => {
      try {
        const { data: personData } = await ApiService.get({
          url: "/customers/" + id,
        });

        setPersonInfo(personData);
        uploadEvents();
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

  useEffect(() => {
    setNewAttributeKey("");
    setNewAttributeValue("");
  }, [isAddingAttribute]);

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

  if (isLoading) return <Progress />;

  return (
    <div className="w-full font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="h-[96px] w-full bg-white border-t-[1px] border-[#E5E7EB] px-[20px] flex justify-between items-center">
        <div className="flex items-center gap-[10px]">
          <UserIcon />
          <div className="flex flex-col gap-[5px]">
            <div className="text-[20px] font-semibold leading-[28px]">
              {personInfo.email}
            </div>
            <div className="text-[#4B5563] font-roboto">Id: {id}</div>
          </div>
        </div>
        <Button type={ButtonType.DANGEROUS} onClick={handleDeletePerson}>
          Delete
        </Button>
      </div>
      <div className="w-full h-[46px] bg-white px-[20px] flex gap-[32px] text-[#000000D9] font-roboto">
        <button
          className={`border-[#4338CA] ${
            currentTab === PersonTab.OVERVIEW
              ? "border-b-[2px] text-[#4338CA]"
              : ""
          }`}
          onClick={() => setCurrentTab(PersonTab.OVERVIEW)}
        >
          Overview
        </button>
        <button
          className={`border-[#4338CA] ${
            currentTab === PersonTab.JOURNEY
              ? "border-b-[2px] text-[#4338CA]"
              : ""
          }`}
          onClick={() => setCurrentTab(PersonTab.JOURNEY)}
        >
          Journeys
        </button>
      </div>
      <div className="w-full h-[calc(100vh-188px)] p-[20px] flex gap-[20px]">
        {currentTab === PersonTab.OVERVIEW ? (
          <>
            <div className="w-full h-fit bg-white rounded-[8px] p-[20px] flex flex-col gap-[20px]">
              <div className="w-full flex justify-between">
                <div className="text-[20px] font-semibold leading-[28px]">
                  {isEditing ? "Edit attributes" : "Attributes"}
                </div>
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
                {Object.keys(personInfoToShow).map((key) =>
                  isEditing ? (
                    <div className="flex flex-col gap-[10px]" key={key}>
                      <div className="text-[#4B5563]">{key}</div>
                      <div className="flex gap-[16px] items-center">
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
                      <div>{key}</div>
                      <div>
                        {typeof personInfoToShow[key] === "object"
                          ? JSON.stringify(personInfoToShow[key])
                          : personInfoToShow[key]}
                      </div>
                    </div>
                  )
                )}

                {isEditing &&
                  (isAddingAttribute ? (
                    <div className="px-[20px] py-[14px] flex flex-col gap-[20px] bg-[#F3F4F6] rounded-[4px] w-full">
                      <div className="flex gap-[20px]">
                        <Input
                          className="w-full"
                          wrapperClassName="w-full"
                          value={newAttributeKey}
                          onChange={(val) => setNewAttributeKey(val)}
                          placeholder="Attribute"
                        />
                        <Input
                          className="w-full"
                          wrapperClassName="w-full"
                          value={newAttributeValue}
                          onChange={(val) => setNewAttributeValue(val)}
                          placeholder="value"
                        />
                      </div>
                      <div className="flex gap-[10px]">
                        <Button
                          type={ButtonType.PRIMARY}
                          onClick={() => {
                            setEditingPersonInfo({
                              ...editingPersonInfo,
                              [newAttributeKey]: newAttributeValue,
                            });
                            setIsAddingAttribute(false);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type={ButtonType.SECONDARY}
                          onClick={() => setIsAddingAttribute(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-fit h-fit"
                      type={ButtonType.SECONDARY}
                      onClick={() => setIsAddingAttribute(true)}
                    >
                      Add an attribute
                    </Button>
                  ))}
              </div>

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
            </div>
            {!isEditing && eventsData.length > 0 && (
              <div className="w-[420px] h-full bg-white rounded-[8px] p-[20px] flex flex-col gap-[20px]">
                <span className="text-[#111827] font-inter text-[20px] leading-[28px] font-semibold">
                  Timeline
                </span>
                <Scrollbars>
                  <div className="flex flex-col w-full">
                    {eventsData.map((el, i) => (
                      <div className="w-full h-[74px] flex">
                        <div className="w-[22px] mr-[10px] relative">
                          <div className="w-[2px] bg-[#0000000F] h-[6px] left-[10px] absolute" />
                          <div className="w-[10px] absolute top-[6px] left-[6px] h-[10px] rounded-full border-[2px] border-[#6366F1]" />
                          {(i + 1 !== eventsData.length ||
                            timeLine?.totalPage === timeLine?.page) && (
                            <div className="w-[2px] bg-[#0000000F] h-[58px] top-[16px] left-[10px] top absolute" />
                          )}
                        </div>
                        <div className="flex flex-col text-[#111827]">
                          <div className="max-w-[230px] text-[16px] leading-[24px] font-semibold font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                            {capitalize(el.event)} {el.templateType}-
                            {el.templateName}
                          </div>
                          <div className="max-w-[230px] text-[14px] leading-[22px] font-normal font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                            Journey: {el.journeyName}
                          </div>
                          <div className="max-w-[230px] text-[12px] leading-[20px] font-normal font-inter text-ellipsis overflow-hidden whitespace-nowrap">
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
                        <div className="w-[10px] absolute top-[6px] left-[6px] h-[10px] rounded-full border-[2px] border-[#6366F1] bg-[#6366F1]" />
                      </div>
                      <div className="flex flex-col text-[#111827]">
                        <div className="max-w-[230px] text-[16px] leading-[24px] font-semibold font-inter text-ellipsis overflow-hidden whitespace-nowrap">
                          Created in Laudspeaker
                        </div>
                        <div className="max-w-[230px] text-[12px] leading-[20px] font-normal font-inter text-ellipsis overflow-hidden whitespace-nowrap">
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
          <div className="w-full h-full bg-white rounded-[8px] p-[20px]">
            <PeopleInJourneyTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default Personv2;
