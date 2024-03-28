import { ApiConfig } from "../../../../constants";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";
import Template from "types/Template";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import { MessageNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import { MessageType } from "types/Workflow";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useDispatch } from "react-redux";
import {
  setNodes,
  setTemplateInlineCreator,
  TemplateInlineEditor,
} from "reducers/flow-builder.reducer";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { useAppSelector } from "store/hooks";
import {
  PushBuilderData,
  PushPlatform,
} from "pages/PushBuilder/PushBuilderContent";
import LockScreenIOS from "pages/PushBuilder/Badges/LockScreenIOS";
import LockScreenAndroid from "pages/PushBuilder/Badges/LockScreenAndroid";
import Select from "components/Elements/Selectv2";
import CogIcon from "@heroicons/react/24/outline/CogIcon";
import { Link } from "react-router-dom";

const MessageSettings: FC<SidePanelComponentProps<MessageNodeData>> = ({
  nodeData,
  setNodeData,
  setIsError,
  showErrors,
}) => {
  const templateType = nodeData.template?.type;
  const selectedTemplate = nodeData.template?.selected;

  const userData = useAppSelector((state) => state.auth.userData);

  const [templateList, setTemplateList] = useState<Template[]>([]);
  const [connectionList, setConnectionList] = useState<
    {
      id: string;
      name: string;
      sendingOptions: {
        id: string;
        sendingEmail: string;
        sendingName?: string;
      }[];
    }[]
  >([]);

  const dispatch = useDispatch();
  const { nodes, templateInlineCreation } = useAppSelector(
    (state) => state.flowBuilder
  );
  const [availablePlatformOptions, setAvailablePlatformOptions] = useState<
    { key: PushPlatform | "All"; title: string }[]
  >([]);

  useEffect(() => {
    if (templateType === MessageType.PUSH)
      setIsError(!nodeData.template?.selected);
    else setIsError(!selectedTemplate?.id);
  }, [nodeData.template]);

  useEffect(() => {
    if (
      ![MessageType.EMAIL, MessageType.SMS, MessageType.PUSH].includes(
        templateType
      )
    ) {
      return;
    }

    (async () => {
      const {
        data: {
          mailgunConnections,
          sendgridConnections,
          resendConnections,
          twilioConnections,
          pushConnections,
        },
      } = await ApiService.get({ url: "/workspaces/channels" });

      setConnectionList(
        templateType === MessageType.EMAIL
          ? [
              ...mailgunConnections,
              ...sendgridConnections,
              ...resendConnections,
            ]
          : templateType === MessageType.SMS
          ? [...twilioConnections]
          : templateType === MessageType.PUSH
          ? [...pushConnections]
          : []
      );
    })();
  }, []);

  const getAllTemplates = async () => {
    const { data: templates } = await ApiService.get<{ data: Template[] }>({
      url: `${ApiConfig.getAllTemplates}`,
    });

    const filteredTemplates = templates?.data?.filter(
      (item: { type?: string }) => item.type === templateType
    );
    setTemplateList(filteredTemplates);
  };

  const handleTemplateInlineEdit = () => {
    const selectedNode = nodes.find((el) => el.selected);

    if (!selectedNode) {
      return;
    }
    const inlineCreator: TemplateInlineEditor = {
      selectedNode,
      type: templateType,
    };

    if (nodeData.template.selected?.id) {
      inlineCreator.templateId = nodeData.template.selected.id.toString();
    }

    dispatch(setTemplateInlineCreator(inlineCreator));
  };

  const countAvailablePlatforms = (data: PushBuilderData) => {
    const isAll = data.platform.Android && data.platform.iOS;

    const options: { key: PushPlatform | "All"; title: string }[] = [];

    if (isAll) {
      options.push(
        {
          key: "All",
          title: "All",
        },
        {
          key: PushPlatform.IOS,
          title: "iOS",
        },
        {
          key: PushPlatform.ANDROID,
          title: "Android",
        }
      );
    } else if (data.platform.Android) {
      options.push({
        key: PushPlatform.ANDROID,
        title: "Android",
      });
    } else if (data.platform.iOS) {
      options.push({
        key: PushPlatform.IOS,
        title: "iOS",
      });
    }

    return options;
  };

  useEffect(() => {
    const selectedNode = nodes.find((el) => el.selected);

    if (
      !templateInlineCreation?.needsCallbackUpdate ||
      templateInlineCreation.selectedNode.id !== selectedNode?.id
    )
      return;

    const newPlatform =
      templateInlineCreation.needsCallbackUpdate.data.platform.Android &&
      templateInlineCreation.needsCallbackUpdate.data.platform.iOS
        ? "All"
        : templateInlineCreation.needsCallbackUpdate.data.platform.Android
        ? PushPlatform.ANDROID
        : PushPlatform.IOS;

    setAvailablePlatformOptions(
      countAvailablePlatforms(templateInlineCreation.needsCallbackUpdate.data)
    );

    setNodeData({
      ...nodeData,
      template: {
        ...nodeData.template,
        selected: {
          id: +templateInlineCreation.needsCallbackUpdate.id,
          name: templateInlineCreation.needsCallbackUpdate.name,
          pushBuilder: {
            ...templateInlineCreation.needsCallbackUpdate.data,
            selectedPlatform: newPlatform,
          },
        },
      },
    });
    dispatch(setTemplateInlineCreator(undefined));
  }, [templateInlineCreation?.needsCallbackUpdate]);

  useEffect(() => {
    getAllTemplates();
  }, [templateType]);

  useEffect(() => {
    if (selectedTemplate?.pushBuilder)
      setAvailablePlatformOptions(
        countAvailablePlatforms(selectedTemplate?.pushBuilder)
      );
  }, []);

  if (!templateType) return <>Unknown template type!</>;

  return (
    <div className="flex flex-col gap-[10px] font-inter font-normal text-[14px] leading-[22px]">
      {templateType !== MessageType.PUSH ? (
        <div className="font-inter font-normal text-[14px] leading-[22px]">
          <div className="flex p-5 justify-between items-center">
            <div>Template</div>
            <div className="flex flex-col gap-[10px]">
              <select
                className="w-[200px] h-[32px] rounded-sm px-[12px] py-[4px] text-[14px] font-roboto leading-[22px]"
                value={selectedTemplate?.id}
                id="template-select"
                onChange={(e) =>
                  setNodeData({
                    ...nodeData,
                    template: {
                      type: templateType,
                      selected: {
                        id: +e.target.value,
                        name:
                          templateList.find(
                            (template) => template.id === +e.target.value
                          )?.name || "",
                      },
                    },
                  })
                }
              >
                <option disabled selected value={undefined}>
                  select template
                </option>
                {templateList.map((template) => (
                  <option value={template.id} key={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : userData.pushPlatforms &&
        Object.keys(userData.pushPlatforms).length === 0 ? (
        <div className="w-full p-5">
          <div className="flex w-full gap-[5px] items-center">
            <CogIcon className="min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] text-[#111827]" />
            <span className="text-base font-inter font-medium text-[#111827]">
              Setup required for Push
            </span>
          </div>
          <div className="text-sm my-[10px] font-inter text-[#111827]">
            Push supports iOS and Android devices. To enable this feature in
            your journey, a brief setup is required for correct delivery.
          </div>
          <Link to="/settings/push" target="_blank">
            <Button
              className="w-full"
              type={ButtonType.PRIMARY}
              onClick={() => {}}
            >
              Go To Push Setup
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="p-5 flex flex-col gap-[10px]">
            <div className="text-[#111827] font-inter text-[14px] leading-[22px] font-semibold">
              Push
            </div>

            {selectedTemplate?.pushBuilder ? (
              <div className="w-full border border-[#E5E7EB] rounded overflow-hidden">
                <div className="px-[10px] py-2 bg-[#F3F4F6] flex justify-between">
                  <div className="max-w-full text-black text-[14px] font-inter font-semibold leading-[22px] overflow-hidden text-ellipsis">
                    {selectedTemplate.name}
                  </div>
                  <div className="min-w-[52px] max-w-[52px] flex justify-between items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="cursor-pointer"
                      onClick={handleTemplateInlineEdit}
                    >
                      <g clipPath="url(#clip0_267_6950)">
                        <path
                          d="M3.45872 12.2841C3.49443 12.2841 3.53015 12.2805 3.56586 12.2752L6.56943 11.7484C6.60515 11.7412 6.63908 11.7252 6.66408 11.6984L14.2337 4.12874C14.2503 4.11222 14.2634 4.0926 14.2724 4.071C14.2813 4.0494 14.2859 4.02624 14.2859 4.00285C14.2859 3.97946 14.2813 3.95631 14.2724 3.9347C14.2634 3.9131 14.2503 3.89348 14.2337 3.87696L11.2659 0.907316C11.2319 0.873387 11.1873 0.85553 11.1391 0.85553C11.0909 0.85553 11.0462 0.873387 11.0123 0.907316L3.44265 8.47696C3.41586 8.50374 3.39979 8.53589 3.39265 8.5716L2.86586 11.5752C2.84849 11.6708 2.8547 11.7693 2.88395 11.862C2.91319 11.9547 2.9646 12.0389 3.03372 12.1073C3.15158 12.2216 3.29979 12.2841 3.45872 12.2841ZM4.66229 9.16982L11.1391 2.69482L12.448 4.00374L5.97122 10.4787L4.38372 10.7591L4.66229 9.16982ZM14.5712 13.7841H1.42836C1.11229 13.7841 0.856934 14.0395 0.856934 14.3555V14.9984C0.856934 15.077 0.921219 15.1412 0.999791 15.1412H14.9998C15.0784 15.1412 15.1426 15.077 15.1426 14.9984V14.3555C15.1426 14.0395 14.8873 13.7841 14.5712 13.7841Z"
                          fill="#111827"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_267_6950">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="cursor-pointer"
                      onClick={() =>
                        setNodeData({
                          ...nodeData,
                          template: {
                            ...nodeData.template,
                            selected: undefined,
                          },
                        })
                      }
                    >
                      <path
                        d="M5.28544 2.14124H5.14258C5.22115 2.14124 5.28544 2.07696 5.28544 1.99839V2.14124H10.714V1.99839C10.714 2.07696 10.7783 2.14124 10.8569 2.14124H10.714V3.42696H11.9997V1.99839C11.9997 1.36803 11.4872 0.85553 10.8569 0.85553H5.14258C4.51222 0.85553 3.99972 1.36803 3.99972 1.99839V3.42696H5.28544V2.14124ZM14.2854 3.42696H1.71401C1.39794 3.42696 1.14258 3.68232 1.14258 3.99839V4.56982C1.14258 4.64839 1.20686 4.71267 1.28544 4.71267H2.36401L2.80508 14.052C2.83365 14.6609 3.33722 15.1412 3.94615 15.1412H12.0533C12.664 15.1412 13.1658 14.6627 13.1944 14.052L13.6354 4.71267H14.714C14.7926 4.71267 14.8569 4.64839 14.8569 4.56982V3.99839C14.8569 3.68232 14.6015 3.42696 14.2854 3.42696ZM11.9158 13.8555H4.08365L3.65151 4.71267H12.3479L11.9158 13.8555Z"
                        fill="#111827"
                      />
                    </svg>
                  </div>
                </div>
                <div className="p-[10px]">
                  {selectedTemplate.pushBuilder.platform.iOS && (
                    <div
                      className={`${
                        selectedTemplate.pushBuilder.platform.iOS &&
                        selectedTemplate.pushBuilder.platform.Android &&
                        "mb-[20px]"
                      }`}
                    >
                      <div className="text-[12px] font-inter text-black mb-[10px]">
                        iOS
                      </div>
                      <LockScreenIOS
                        settings={selectedTemplate.pushBuilder.settings.iOS}
                      />
                    </div>
                  )}
                  {selectedTemplate.pushBuilder.platform.Android && (
                    <div>
                      <div className="text-[12px] rounded- font-inter text-black mb-[10px]">
                        Android
                      </div>
                      <LockScreenAndroid
                        settings={selectedTemplate.pushBuilder.settings.Android}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button
                type={ButtonType.PRIMARY}
                onClick={handleTemplateInlineEdit}
              >
                Add
              </Button>
            )}
          </div>
          <div className="w-full border-[#E5E7EB] border-t-[1px] !my-[-10px]" />
          {nodeData.template.selected?.pushBuilder?.selectedPlatform && (
            <div className="p-5 flex flex-col gap-[10px]">
              <div className="text-[#111827] font-inter text-[14px] leading-[22px] font-semibold">
                Platform
              </div>
              <Select
                value={nodeData.template.selected.pushBuilder.selectedPlatform}
                options={availablePlatformOptions}
                onChange={(key) =>
                  nodeData.template.selected?.pushBuilder &&
                  setNodeData({
                    ...nodeData,
                    template: {
                      ...nodeData.template,
                      selected: {
                        ...nodeData.template.selected,
                        pushBuilder: {
                          ...nodeData.template.selected?.pushBuilder,
                          selectedPlatform: key,
                        },
                      },
                    },
                  })
                }
              />
              {availablePlatformOptions.length === 1 && (
                <div className="text-[12px] font-inter leading-5 text-[#4B5563]">
                  The current push is set exclusively for iOS devices
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2.5 p-5 justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
        <div>Connection</div>
        <div className="flex flex-col gap-[10px]">
          <Select
            className="w-[200px] min-h-[32px]"
            buttonClassName="w-[200px] min-h-[32px]"
            buttonInnerWrapperClassName="w-[200px] min-h-[32px]"
            value={nodeData.connectionId}
            onChange={(value) =>
              setNodeData({ ...nodeData, connectionId: value })
            }
            options={connectionList.map((connection) => ({
              key: connection.id,
              title: connection.name,
            }))}
            placeholder="select connection"
          />
        </div>
      </div>

      {templateType === MessageType.EMAIL && (
        <div className="flex gap-2.5 p-5 justify-between items-center">
          <div>Sending option</div>
          <div className="flex flex-col gap-[10px]">
            <Select
              className="w-[200px] min-h-[32px]"
              buttonClassName="w-[200px] min-h-[32px]"
              buttonInnerWrapperClassName="w-[200px] min-h-[32px]"
              value={nodeData.sendingOptionId}
              onChange={(value) =>
                setNodeData({ ...nodeData, sendingOptionId: value })
              }
              options={
                nodeData.connectionId
                  ? connectionList
                      .find(
                        (connection) => connection.id === nodeData.connectionId
                      )
                      ?.sendingOptions.map((option) => ({
                        key: option.id,
                        title: `${option.sendingEmail}${
                          option.sendingName ? ` <${option.sendingName}>` : ""
                        }`,
                      })) || []
                  : []
              }
              placeholder="select option"
            />
          </div>
        </div>
      )}

      {showErrors && !selectedTemplate && (
        <span className="px-5 mt-[10px] font-inter font-normal text-[14px] leading-[22px] text-[#F43F5E]">
          No template is selected
        </span>
      )}
    </div>
  );
};

export default MessageSettings;
