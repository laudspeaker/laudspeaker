import { GenericButton, Input } from "components/Elements";
import Header from "components/Header";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import {
  CheckIcon,
  HandThumbUpIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import { ApiConfig } from "./../../constants";
import Progress from "components/Progress";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import SnippetPicker from "components/SnippetPicker/SnippetPicker";
import AceEditor from "react-ace";

const eventTypes = {
  applied: { icon: UserIcon, bgColorClass: "bg-gray-400" },
  advanced: { icon: HandThumbUpIcon, bgColorClass: "bg-blue-500" },
  completed: { icon: CheckIcon, bgColorClass: "bg-green-500" },
};

const KEYS_TO_SKIP = ["_id", "ownerId", "__v", "verified"];

export interface IEventsFetchData {
  id: string;
  name: string;
  event: string;
  createdAt: string;
  audname: string;
  audName: string;
  json: object;
}

interface ITimeline {
  id: string;
  type: {
    icon: (
      props: React.SVGProps<SVGSVGElement> & {
        title?: string | undefined;
        titleId?: string | undefined;
      }
    ) => JSX.Element;
    bgColorClass: string;
  };
  name?: string;
  audName?: string;
  content: string;
  date: string;
  datetime: string;
  json: object;
}

const LiveEvents = () => {
  const { id } = useParams();
  const [personInfo, setPersonInfo] = useState<Record<string, any>>({});
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isShowJson, setIsShowJson] = useState(false);
  const [snippet, setSnippet] = useState("");

  const [timeline, setTimeline] = useState<ITimeline[]>([
    {
      id: "1",
      type: eventTypes.applied,
      content: "First seen in laudspeaker",
      date: "Sep 20",
      datetime: "2020-09-20",
      json: { sumthin: "oi" },
    },
  ]);

  const people = [
    {
      name: "Lindsay Walton",
      imageUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80",
    },
    // More people...
  ];
  const activityItems = [
    {
      id: 1,
      person: people[0],
      project: "Workcation",
      commit: "2d89f0c8",
      environment: "production",
      time: "1h",
    },
    {
      id: 2,
      person: people[0],
      project: "Workcation",
      commit: "2d89f0c8",
      environment: "production",
      time: "1h",
    },
    // More items...
  ];

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data: personData } = await ApiService.get({
          url: "/customers/" + id,
        });
        if (personData.createdAt) {
          const [firstItem, ...items] = timeline;
          const creationDate = new Date(personData.createdAt);
          firstItem.datetime = creationDate.toUTCString();
          firstItem.date = creationDate.toLocaleDateString();
          setTimeline([firstItem, ...items]);
        }
        setPersonInfo(personData);

        const { data: eventsData } = await ApiService.get<IEventsFetchData[]>({
          url: `/customers/${id}/events`,
        });
        setTimeline([
          ...timeline,
          ...eventsData.map((item) => ({
            id: item.id + item.name + item.audName + item.event,
            type: eventTypes.completed,
            content: "Email " + item.event,
            datetime: item.createdAt,
            name: item.name,
            audName: item.audname,
            date: new Date(item.createdAt).toLocaleString(),
            json: item.json,
          })),
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handlePersonInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPersonInfo({ ...personInfo, [e.target.name]: e.target.value });
  };

  const handleShowEvent = async () => {
    setIsShowJson(true);
  };

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
      setIsEditingMode(false);
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

  const handleDeleteAttribute = (key: string) => {
    const newPersonInfo = { ...personInfo };
    newPersonInfo[key] = null;
    setPersonInfo(newPersonInfo);
  };

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  if (isLoading) return <Progress />;

  return (
    <div className="w-full min-h-screen">
      <Header />
      <div className="p-[30px_50px]">
        <div className="flex justify-between items-center">
          <div className="">
            <h3 className="text-[32px]">{personInfo.name || personInfo._id}</h3>
            <h6></h6>
          </div>
          <div className="flex h-[50px] gap-[10px]">
            <GenericButton
              onClick={handleDeletePerson}
              loading={isSaving}
              disabled={isSaving}
            >
              Refresh
            </GenericButton>
          </div>
        </div>
        <div className="flex gap-[30px]">
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2 lg:col-start-1">
              <section
                aria-labelledby="timeline-title"
                className="lg:col-span-1 lg:col-start-3"
              >
                <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
                  <h2
                    id="timeline-title"
                    className="text-lg font-medium text-gray-900"
                  >
                    Timeline 2
                  </h2>

                  {/* Activity Feed */}
                  <div>
                    <ul role="list" className="divide-y divide-gray-200">
                      {activityItems.map((activityItem) => (
                        <li
                          key={activityItem.id}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium cursor-pointer hover:bg-gray-100"
                          onClick={() => handleShowEvent()}
                        >
                          <div className="flex space-x-3">
                            <img
                              className="h-6 w-6 rounded-full"
                              src={activityItem.person.imageUrl}
                              alt=""
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">
                                  {activityItem.person.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {activityItem.time}
                                </p>
                              </div>
                              <p className="text-sm text-gray-500">
                                Deployed {activityItem.project} (
                                {activityItem.commit} in master) to{" "}
                                {activityItem.environment}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            <section
              aria-labelledby="timeline-title"
              className="lg:col-span-1 lg:col-start-3"
            >
              <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
                <h2
                  id="timeline-title"
                  className="text-lg font-medium text-gray-900"
                >
                  Json
                </h2>

                {/* Activity Feed */}
                <div className="mt-6 flow-root">
                  <div className="shadow sm:rounded-md">
                    <AceEditor
                      aria-label="editor"
                      mode={"javascript"}
                      theme="monokai"
                      name="editor"
                      fontSize={12}
                      minLines={15}
                      maxLines={40}
                      width="100%"
                      showPrintMargin={false}
                      showGutter
                      placeholder="Write your Query here..."
                      editorProps={{ $blockScrolling: true }}
                      setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                      }}
                      value={snippet}
                      onChange={(val) => setSnippet(val)}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEvents;
