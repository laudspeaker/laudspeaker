import React, { Fragment, useEffect, useState } from "react";
import arrowRightIconImage from "../svg/arrow-right.svg";
import emailCardIconImage from "../svg/email-card-icon.svg";
import twilioCardIconImage from "../svg/twilio-card-icon.svg";
import customModalCardIconImage from "../svg/custom-modal-card-icon.svg";
import slackCardIconImage from "../svg/slack-card-icon.svg";
import pushLogoIcon from "../svg/push-logo-icon.svg";
import { useNavigate } from "react-router-dom";
import Account from "types/Account";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import emptyDataImage from "../svg/empty-data.svg";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import sortAscChevronsImage from "../../JourneyTablev2/svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "../../JourneyTablev2/svg/sort-desc-chevrons.svg";
import { format } from "date-fns";
import { Menu, Transition } from "@headlessui/react";
import Pagination from "components/Pagination";
import { confirmAlert } from "react-confirm-alert";
import AddNotificationPreferenceModal from "../AddNotificationPreferenceModal";

enum MESSAGE_CHANNELS_TABS {
  CONNECTIONS = "Connections",
  PREFERENCES = "Notification Preferences",
}

export enum MessageChannel {
  PUSH,
  MAILGUN,
  SENDGRID,
  RESEND,
  TWILIO,
  CUSTOM_MODAL,
  SLACK,
  BYOS,
}

export interface WorkspaceNotificationPreferencesData {
  subscribed?: boolean;
  id: string;
  name: string;
  title: string;
  createdAt: string;
  description: string;
}

interface MessageChannelAdditionalInfoFixture {
  key: keyof Account["workspace"];
  title: string;
}

interface MessageChannelCardFixture {
  id: string;
  channel: MessageChannel;
  title: string;
  icon: string;
  beta?: boolean;
  commingSoon?: boolean;
  disabled?: boolean;
  connected?: boolean;
  additionalInfo?: MessageChannelAdditionalInfoFixture[];
}

interface PushPlatform {
  fileName: string;
  isTrackingDisabled: boolean;
}

const messageChannelToLinkMap: Record<MessageChannel, string> = {
  [MessageChannel.PUSH]: "/settings/push",
  [MessageChannel.MAILGUN]: "/settings/email/mailgun",
  [MessageChannel.SENDGRID]: "/settings/email/sendgrid",
  [MessageChannel.RESEND]: "/settings/email/resend",
  [MessageChannel.TWILIO]: "/settings/sms",
  [MessageChannel.CUSTOM_MODAL]: "",
  [MessageChannel.SLACK]: "",
  [MessageChannel.BYOS]: "/settings/email/smtp",
};

const supportedMessageChannelCardsFixtures: Record<
  MessageChannel,
  MessageChannelCardFixture
> = {
  [MessageChannel.PUSH]: {
    id: "create",
    channel: MessageChannel.PUSH,
    title: "Push",
    icon: pushLogoIcon,
  },
  [MessageChannel.MAILGUN]: {
    id: "create",
    channel: MessageChannel.MAILGUN,
    title: "Mailgun",
    icon: emailCardIconImage,
  },
  [MessageChannel.SENDGRID]: {
    id: "create",
    channel: MessageChannel.SENDGRID,
    title: "Sendgrid",
    icon: emailCardIconImage,
  },
  [MessageChannel.RESEND]: {
    id: "create",
    channel: MessageChannel.RESEND,
    title: "Resend",
    icon: emailCardIconImage,
  },
  [MessageChannel.TWILIO]: {
    id: "create",
    channel: MessageChannel.TWILIO,
    title: "Twilio SMS",
    icon: twilioCardIconImage,
  },
  [MessageChannel.CUSTOM_MODAL]: {
    id: "create",
    channel: MessageChannel.CUSTOM_MODAL,
    title: "Onboarding Suite",
    icon: customModalCardIconImage,
    commingSoon: true,
    disabled: true,
  },
  [MessageChannel.SLACK]: {
    id: "create",
    channel: MessageChannel.SLACK,
    title: "Slack",
    icon: slackCardIconImage,
    commingSoon: true,
    disabled: true,
  },
  [MessageChannel.BYOS]: {
    id: "create",
    channel: MessageChannel.BYOS,
    title: "Bring Your Own SMTP",
    icon: emailCardIconImage,
  },
};

const MessageChannelTab = () => {
  const [tab, setTab] = useState(MESSAGE_CHANNELS_TABS.CONNECTIONS);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<Account>();

  const [isASC, setIsASC] = useState(false);
  const [preferencesData, setPreferencesData] = useState<
    WorkspaceNotificationPreferencesData[]
  >([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  const loadPreferencesData = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<
        WorkspaceNotificationPreferencesData[]
      >({
        url: "/notification-preferences",
      });
      setPreferencesData(data);
    } catch (error) {
      toast.error("Error fetching notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreference = async (preference: {
    name: string;
    title: string;
    description: string;
    selectedChannels: string[];
    tags: string[];
  }) => {
    console.log("New Preference:", preference);

    // Ensure all data is being captured correctly
    console.log("Name:", preference.name);
    console.log("Title:", preference.title);
    console.log("Description:", preference.description);
    console.log("Selected Channels:", preference.selectedChannels);
    console.log("Tags:", preference.tags);

    // Add API call or state update logic here
    await ApiService.post({
      url: `/notification-preferences/`,
      options: {
        name: preference.name,
        title: preference.title,
        description: preference.description,
        journey_tags: preference.tags,
        channels: preference.selectedChannels,
      },
    });
    await loadPreferencesData();
  };

  const connectedFixtures: MessageChannelCardFixture[] = [
    ...(account?.workspace.mailgunConnections.map((connection) => ({
      id: connection.id,
      channel: MessageChannel.MAILGUN,
      title: connection.name,
      icon: emailCardIconImage,
    })) || []),
    ...(account?.workspace.resendConnections.map((connection) => ({
      id: connection.id,
      channel: MessageChannel.RESEND,
      title: connection.name,
      icon: emailCardIconImage,
    })) || []),
    ...(account?.workspace.sendgridConnections.map((connection) => ({
      id: connection.id,
      channel: MessageChannel.SENDGRID,
      title: connection.name,
      icon: emailCardIconImage,
    })) || []),
    ...(account?.workspace.twilioConnections.map((connection) => ({
      id: connection.id,
      channel: MessageChannel.TWILIO,
      title: connection.name,
      icon: twilioCardIconImage,
    })) || []),
    ...(Object.entries(account?.workspace.pushPlatforms || {}).map(
      ([key, connection]: [string, PushPlatform]) => ({
        id: key,
        channel: MessageChannel.PUSH,
        title: connection.fileName,
        icon: pushLogoIcon,
      })
    ) || []),
  ];

  const supportedFixtures = Object.values(supportedMessageChannelCardsFixtures);

  useEffect(() => {
    if (tab === MESSAGE_CHANNELS_TABS.CONNECTIONS) {
      (async () => {
        setIsLoading(true);
        try {
          const { data } = await ApiService.get<Account>({ url: "/accounts" });
          setAccount(data);
        } catch (e) {
          toast.error("Error while loading data");
        } finally {
          setIsLoading(false);
        }
      })();
    }
    if (tab === MESSAGE_CHANNELS_TABS.PREFERENCES) {
      loadPreferencesData();
      // (async () => {
      //   setIsLoading(true);
      //   try {
      //     const { data } = await ApiService.get<
      //       WorkspaceNotificationPreferencesData[]
      //     >({
      //       url: "/notification-preferences",
      //     });
      //     console.log(data);
      //     setPreferencesData(data);
      //   } catch (error) {
      //     toast.error("Error fetching notification preferences");
      //   } finally {
      //     setIsLoading(false);
      //   }
      // })();
    }
  }, [tab]);

  const handleDeletePreference = (preferenceId: string) => () => {
    confirmAlert({
      title: "Notification Deletion Confirmation",
      message: "Are you sure you want to delete this notification preference?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsLoading(true);
            try {
              await ApiService.delete({
                url: `/notification-preferences/${preferenceId}`,
              });
              await loadPreferencesData();
            } catch (error) {
              toast.error(JSON.stringify(error));
            }
            setIsLoading(false);
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  return (
    <div
      className={`${
        isLoading && "opacity-70 animation-pulse pointer-events-none"
      } p-5 pt-[10px]`}
    >
      <div className="relative flex gap-8">
        {Object.values(MESSAGE_CHANNELS_TABS).map((el) => (
          <div
            key={el}
            className={`${
              tab == el && "text-[#6366F1] !border-b-[#6366F1]"
            } text-[#000000D9] border-b-transparent border-b-[2px] transition-all text-sm font-roboto cursor-pointer pb-2`}
            onClick={() => setTab(el as MESSAGE_CHANNELS_TABS)}
          >
            {el}
          </div>
        ))}
        <div className="absolute w-[calc(100%+40px)] -left-5 bottom-0 border-[#E5E7EB] border-t"></div>
      </div>

      {tab === MESSAGE_CHANNELS_TABS.CONNECTIONS ? (
        <div className="p-5 flex flex-col gap-5">
          <div className="text-[#4B5563]">
            Browse the available channels in Laudspeaker, and set up the
            channels you want to use{" "}
            <a
              href="https://laudspeaker.com/docs/getting-started/setting-up-mobile-push"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111827] font-bold underline"
            >
              Documentation
            </a>
          </div>

          <div className="w-full h-[1px] bg-[#E5E7EB]" />

          {connectedFixtures.length > 0 ? (
            <>
              <div className="font-inter text-[16px] font-semibold leading-[24px]">
                Connected Channels
              </div>

              {connectedFixtures.map((fixture, i) => (
                <button
                  key={i}
                  id={fixture.title.split(" ").join("-").toLowerCase()}
                  onClick={
                    fixture.disabled
                      ? () => {}
                      : () =>
                          navigate(
                            `${messageChannelToLinkMap[fixture.channel]}/${
                              fixture.id
                            }`
                          )
                  }
                  className="p-5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col gap-[10px]"
                >
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-[10px]">
                      <div>
                        <img src={fixture.icon} alt={`${fixture.title} icon`} />
                      </div>

                      <div className="text-[#18181B] font-inter text-base">
                        {fixture.title}
                      </div>

                      {fixture.beta && (
                        <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-5 text-[#4B5563] border border-[#E5E7EB] bg-white">
                          Beta
                        </div>
                      )}
                    </div>

                    <div>
                      <img
                        src={arrowRightIconImage}
                        alt="Navigate to channel"
                      />
                    </div>
                  </div>

                  {fixture.additionalInfo &&
                    fixture.additionalInfo.length > 0 && (
                      <>
                        <div className="h-[1px] w-full bg-[#E5E7EB]" />

                        <div className="flex w-full">
                          {fixture.additionalInfo.map((info, j) => (
                            <div
                              key={j}
                              className="w-full flex flex-col gap-[5px]"
                            >
                              <div className="w-fit font-inter text-[14px] text-[#4B5563]">
                                {info.title}
                              </div>
                              <div className="w-fit font-inter text-[14px] text-[#18181B]">
                                {String(account?.workspace?.[info.key])}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                </button>
              ))}
            </>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center select-none">
              <div className="flex flex-col items-center gap-5">
                <img src={emptyDataImage} alt="No data" />

                <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#4B5563]">
                  No channels configured. Select a channel to get started.
                </div>
              </div>
            </div>
          )}

          {connectedFixtures.length > 0 && supportedFixtures.length > 0 && (
            <div className="w-full h-[1px] bg-[#E5E7EB]" />
          )}

          {supportedFixtures.length > 0 && (
            <>
              <div className="font-inter text-[16px] font-semibold leading-[24px]">
                Supported channels
              </div>

              {supportedFixtures.map((fixture, i) => (
                <button
                  key={i}
                  id={fixture.title.split(" ").join("-").toLowerCase()}
                  onClick={
                    fixture.disabled
                      ? () => {}
                      : () =>
                          navigate(
                            `${messageChannelToLinkMap[fixture.channel]}/${
                              fixture.id
                            }`
                          )
                  }
                  className={`p-5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex justify-between items-center ${
                    fixture.disabled
                      ? "select-none cursor-default grayscale"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-[10px]">
                    <div>
                      <img src={fixture.icon} />
                    </div>

                    <div className="text-[#18181B] font-inter text-base">
                      {fixture.title}
                    </div>

                    {fixture.beta && (
                      <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-5 text-[#4B5563] border border-[#E5E7EB] bg-white">
                        Beta
                      </div>
                    )}

                    {fixture.commingSoon && (
                      <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-5 text-[#4B5563] border border-[#E5E7EB] bg-white">
                        comming soon
                      </div>
                    )}
                  </div>

                  <div>
                    <img src={arrowRightIconImage} />
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-base  text-[#111827] font-inter font-semibold">
              Notification Preferences
            </p>
            <Button
              disabled={false}
              type={ButtonType.SECONDARY}
              onClick={() => {
                window.open(
                  `/notification-preferences?workspaceId=${account?.workspace.id}&customerId=test`,
                  "_blank"
                );
              }}
            >
              Preview Your Notification Preferences Page
            </Button>
            <Button
              disabled={false}
              type={ButtonType.PRIMARY}
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              Add a notification preference
            </Button>
          </div>
          <table className="my-[10px] min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-5 py-[10.5px] sticky top-0 z-10 border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75 text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-5 py-[10.5px] sticky top-0 z-10 hidden border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter sm:table-cell"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="cursor-pointer select-none px-5 py-[10.5px] sticky top-0 z-10 hidden border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter sm:table-cell"
                  onClick={() => setIsASC(!isASC)}
                >
                  <div className="flex items-center gap-1">
                    Created At
                    <img
                      src={isASC ? sortAscChevronsImage : sortDescChevronsImage}
                    />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-5 py-[10.5px] sticky top-0 z-10 border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter"
                ></th>
              </tr>
            </thead>
            {/*<tbody>
              {preferencesData.map((preference, preferenceIndex, arr) => (
                <tr key={preferenceIndex}>
                  <td
                    className={`border-b cursor-pointer border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter text-[#6366F1] sm:pl-6 lg:pl-8`}
                    onClick={() => {
                      // setViewTeamMember(preference);
                    }}
                  >
                    {preference.name}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter sm:table-cell`}
                  >
                    {preference.title}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter lg:table-cell`}
                  >
                    {format(new Date(preference.createdAt), "MM/dd/yyyy HH:mm")}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap px-5 py-4 text-sm text-gray-500`}
                  >
                    <div className={`p-3 cursor-pointer`}>
                      <Menu as="div" className="relative">
                        <Menu.Button>
                          <button className="px-[5px] py-[11px] rounded">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="3"
                              viewBox="0 0 16 3"
                              fill="none"
                            >
                              <path
                                d="M2.75 1.5C2.75 1.69891 2.67098 1.88968 2.53033 2.03033C2.38968 2.17098 2.19891 2.25 2 2.25C1.80109 2.25 1.61032 2.17098 1.46967 2.03033C1.32902 1.88968 1.25 1.69891 1.25 1.5C1.25 1.30109 1.32902 1.11032 1.46967 0.96967C1.61032 0.829018 1.80109 0.75 2 0.75C2.19891 0.75 2.38968 0.829018 2.53033 0.96967C2.67098 1.11032 2.75 1.30109 2.75 1.5ZM8.75 1.5C8.75 1.69891 8.67098 1.88968 8.53033 2.03033C8.38968 2.17098 8.19891 2.25 8 2.25C7.80109 2.25 7.61032 2.17098 7.46967 2.03033C7.32902 1.88968 7.25 1.69891 7.25 1.5C7.25 1.30109 7.32902 1.11032 7.46967 0.96967C7.61032 0.829018 7.80109 0.75 8 0.75C8.19891 0.75 8.38968 0.829018 8.53033 0.96967C8.67098 1.11032 8.75 1.30109 8.75 1.5ZM14.75 1.5C14.75 1.69891 14.671 1.88968 14.5303 2.03033C14.3897 2.17098 14.1989 2.25 14 2.25C13.8011 2.25 13.6103 2.17098 13.4697 2.03033C13.329 1.88968 13.25 1.69891 13.25 1.5C13.25 1.30109 13.329 1.11032 13.4697 0.96967C13.6103 0.829018 13.8011 0.75 14 0.75C14.1989 0.75 14.3897 0.829018 14.5303 0.96967C14.671 1.11032 14.75 1.30109 14.75 1.5Z"
                                stroke="#111827"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        </Menu.Button>
                        {preference.id && (
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute z-[120] right-0 origin-top-right w-[200px] rounded-sm bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              {
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      className={`block w-full text-left py-[5px] px-[12px] text-[#F43F5E] ${
                                        active ? "bg-[#F3F4F6]" : ""
                                      }`}
                                      onClick={handleDeletePreference(
                                        preference.id
                                      )}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </Menu.Item>
                              }
                            </Menu.Items>
                          </Transition>
                        )}
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>*/}
            <tbody>
              {preferencesData.map((preference, preferenceIndex) => (
                <tr key={preferenceIndex}>
                  <td
                    className={`border-b cursor-pointer border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter text-[#6366F1] sm:pl-6 lg:pl-8`}
                  >
                    {preference.name}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter sm:table-cell`}
                  >
                    {preference.title}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter lg:table-cell`}
                  >
                    {/*format(new Date(preference.createdAt), "MM/dd/yyyy HH:mm")*/}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap px-5 py-4 text-sm text-gray-500`}
                  >
                    <div className={`p-3 cursor-pointer`}>
                      <Menu as="div" className="relative">
                        <Menu.Button>
                          <button className="px-[5px] py-[11px] rounded">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="3"
                              viewBox="0 0 16 3"
                              fill="none"
                            >
                              <path
                                d="M2.75 1.5C2.75 1.69891 2.67098 1.88968 2.53033 2.03033C2.38968 2.17098 2.19891 2.25 2 2.25C1.80109 2.25 1.61032 2.17098 1.46967 2.03033C1.32902 1.88968 1.25 1.69891 1.25 1.5C1.25 1.30109 1.32902 1.11032 1.46967 0.96967C1.61032 0.829018 1.80109 0.75 2 0.75C2.19891 0.75 2.38968 0.829018 2.53033 0.96967C2.67098 1.11032 2.75 1.30109 2.75 1.5ZM8.75 1.5C8.75 1.69891 8.67098 1.88968 8.53033 2.03033C8.38968 2.17098 8.19891 2.25 8 2.25C7.80109 2.25 7.61032 2.17098 7.46967 2.03033C7.32902 1.88968 7.25 1.69891 7.25 1.5C7.25 1.30109 7.32902 1.11032 7.46967 0.96967C7.61032 0.829018 7.80109 0.75 8 0.75C8.19891 0.75 8.38968 0.829018 8.53033 0.96967C8.67098 1.11032 8.75 1.30109 8.75 1.5ZM14.75 1.5C14.75 1.69891 14.671 1.88968 14.5303 2.03033C14.3897 2.17098 14.1989 2.25 14 2.25C13.8011 2.25 13.6103 2.17098 13.4697 2.03033C13.329 1.88968 13.25 1.69891 13.25 1.5C13.25 1.30109 13.329 1.11032 13.4697 0.96967C13.6103 0.829018 13.8011 0.75 14 0.75C14.1989 0.75 14.3897 0.829018 14.5303 0.96967C14.671 1.11032 14.75 1.30109 14.75 1.5Z"
                                stroke="#111827"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute z-[120] right-0 origin-top-right w-[200px] rounded-sm bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`block w-full text-left py-[5px] px-[12px] text-[#F43F5E] ${
                                      active ? "bg-[#F3F4F6]" : ""
                                    }`}
                                    onClick={handleDeletePreference(
                                      preference.id
                                    )}
                                  >
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            }
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={pageCount}
              />
            </div>
          )}
        </div>
      )}
      <AddNotificationPreferenceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePreference}
        connectedFixtures={connectedFixtures.map((fixture) => {
          return {
            id: fixture.id,
            name: fixture.title,
          };
        })}
      />
    </div>
  );
};

export default MessageChannelTab;
