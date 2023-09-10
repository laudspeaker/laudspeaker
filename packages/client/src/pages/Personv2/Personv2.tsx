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

export interface EventsFetchData {
  id: string;
  name: string;
  event: string;
  createdAt: string;
  audname: string;
  audName: string;
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

  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRenderSave, setIsFirstRenderSave] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentTab, setCurrentTab] = useState(PersonTab.OVERVIEW);

  useEffect(() => {
    (async () => {
      try {
        const { data: personData } = await ApiService.get({
          url: "/customers/" + id,
        });
        // if (personData.createdAt) {
        //   const [firstItem, ...items] = timeline;
        //   const creationDate = new Date(personData.createdAt);
        //   firstItem.datetime = creationDate.toUTCString();
        //   firstItem.date = creationDate.toLocaleDateString();
        //   setTimeline([firstItem, ...items]);
        // }
        setPersonInfo(personData);

        // const { data: eventsData } = await ApiService.get<EventsFetchData[]>({
        //   url: `/customers/${id}/events`,
        // });

        // TODO: Fix with timeline fix
        // setTimeline([
        //   ...timeline,
        //   ...eventsData.map((item) => ({
        //     id: item.id + item.name + item.audName + item.event,
        //     type: eventTypes.completed,
        //     content: "Email " + item.event,
        //     datetime: item.createdAt,
        //     name: item.name,
        //     audName: item.audname,
        //     date: new Date(item.createdAt).toLocaleString(),
        //   })),
        // ]);
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
          Journey
        </button>
      </div>
      <div className="w-full h-[calc(100vh-188px)] p-[20px] flex gap-[20px]">
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
                        const newEditingPersonInfo = { ...editingPersonInfo };
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
        {!isEditing && (
          <div className="w-[420px] h-full bg-white rounded-[8px] p-[20px] flex flex-col gap-[20px]"></div>
        )}
      </div>
    </div>
  );
};

export default Personv2;
