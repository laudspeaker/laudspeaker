import Header from "components/Header";
import { ApiConfig } from "../../constants";
import React, { useEffect, useLayoutEffect } from "react";
import ApiService from "services/api.service";
import Input from "../../components/Elements/Input";
import Select from "../../components/Elements/Select";

import { allEventChannels } from "../Settings/EventsProvider";
import { allEmailChannels } from "../Settings/EmailProvider";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setDomainsList, setSettingsPrivateApiKey } from "reducers/settings";
import { useDispatch } from "react-redux";
import { useState } from "react";
import CSS from "csstype";
import Modal from "components/Elements/Modal";
import { toast } from "react-toastify";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface IntegrationsData {
  sendingName: string;
  sendingEmail: string;
  testSendingEmail: string;
  testSendingName: string;
  slackId: string;
  eventProvider: string;
  emailProvider: string;
  mailgunAPIKey: string;
  posthogApiKey: string;
  posthogProjectId: string;
  posthogHostUrl: string;
  posthogSmsKey: string;
  posthogEmailKey: string;
  sendgridApiKey: string;
  sendgridFromEmail: string;
}

export default function OnboardingBeta() {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);
  const [integrationsData, setIntegrationsData] = useState<IntegrationsData>({
    sendingName: "",
    sendingEmail: "",
    testSendingEmail: "",
    testSendingName: "",
    slackId: "",
    mailgunAPIKey: "",
    eventProvider: "posthog",
    emailProvider: "",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHostUrl: "app.posthog.com",
    posthogSmsKey: "",
    posthogEmailKey: "",
    sendgridApiKey: "",
    sendgridFromEmail: "",
  });
  const dispatch = useDispatch();
  const [slackInstallUrl, setSlackInstallUrl] = useState<string>("");
  const [domainName, setDomainName] = useState<any>(settings.domainName || "");
  const [domainList, setDomainList] = useState<any>(domainsList || []);
  const [privateApiKey, setPrivateApiKey] = useState<string>("");
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [verified, setVerified] = useState(false);

  const callDomains = async () => {
    if (privateApiKey) {
      dispatch(setSettingsPrivateApiKey(privateApiKey));
      const response = await dispatch(setDomainsList(privateApiKey));
      if (response?.data) {
        setDomainList(response?.data);
      }
    }
  };

  useLayoutEffect(() => {
    const func = async () => {
      const { data } = await ApiService.get({
        url: `${ApiConfig.slackInstall}`,
      });
      setSlackInstallUrl(data);
    };
    func();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const {
        sendingName,
        sendingEmail,
        slackTeamId,
        mailgunAPIKey,
        posthogApiKey,
        posthogProjectId,
        posthogHostUrl,
        posthogSmsKey,
        posthogEmailKey,
        emailProvider,
        testSendingEmail,
        testSendingName,
        sendingDomain,
        verified: verifiedFromRequest,
        sendgridApiKey,
        sendgridFromEmail,
      } = data;
      setIntegrationsData({
        ...integrationsData,
        posthogApiKey,
        posthogProjectId,
        posthogHostUrl,
        posthogSmsKey,
        posthogEmailKey,
        sendingName,
        sendingEmail,
        emailProvider,
        testSendingEmail,
        testSendingName,
        slackId: slackTeamId?.[0],
        sendgridApiKey,
        sendgridFromEmail,
      });
      setPrivateApiKey(mailgunAPIKey);
      setDomainName(sendingDomain);
      setVerified(verifiedFromRequest);
    })();
  }, []);

  const handleIntegrationsDataChange = (e: any) => {
    setIntegrationsData({
      ...integrationsData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      await ApiService.patch({
        url: "/accounts",
        options: {
          ...integrationsData,
          sendingDomain: domainName,
          mailgunAPIKey: privateApiKey,
        },
      });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Unexpected error", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  const parametersToConfigure: { [key: string]: React.ReactElement } = {
    posthog: (
      <form className="grid grid-cols-6 gap-6">
        <Input
          isRequired
          value={integrationsData.posthogApiKey}
          label="Private API Key"
          placeholder={"****  "}
          name="posthogApiKey"
          id="posthogApiKey"
          onChange={handleIntegrationsDataChange}
        />
        <Input
          isRequired
          value={integrationsData.posthogProjectId}
          label="Project Id"
          placeholder={"****  "}
          name="posthogProjectId"
          id="posthogProjectId"
          onChange={handleIntegrationsDataChange}
        />
        <Input
          isRequired
          value={integrationsData.posthogHostUrl}
          label="Posthog Url"
          placeholder={"https://app.posthog.com"}
          name="posthogHostUrl"
          id="posthogHostUrl"
          onChange={handleIntegrationsDataChange}
        />
        <Input
          isRequired
          value={integrationsData.posthogSmsKey}
          label="Name of SMS / Phone number field on your Posthog person"
          placeholder={"$phoneNumber"}
          name="posthogSmsKey"
          id="posthogSmsKey"
          onChange={handleIntegrationsDataChange}
        />
        <Input
          isRequired
          value={integrationsData.posthogEmailKey}
          label="Name of Email address field on your Posthog person"
          placeholder={"$email"}
          name="posthogEmailKey"
          id="posthogEmailKey"
          onChange={handleIntegrationsDataChange}
        />
      </form>
    ),
    mailgun: (
      <>
        <Input
          isRequired
          value={privateApiKey}
          label="Private API Key"
          placeholder={"****  "}
          name="privateApiKey"
          id="privateApiKey"
          type="password"
          labelClass="!text-[16px]"
          onChange={(e) => {
            setPrivateApiKey(e.target.value);
            handleIntegrationsDataChange(e);
          }}
          onBlur={callDomains}
        />
        <Select
          id="activeJourney"
          value={domainName}
          options={domainList.map((item: any) => ({
            value: item.name,
          }))}
          onChange={(value) => {
            setDomainName(value);
          }}
          displayEmpty
          renderValue={(val: any) => val}
          sx={{
            height: "44px",
            margin: "20px 0px",
          }}
          inputProps={{
            "& .MuiSelect-select": {
              padding: "9px 15px",
              border: "1px solid #DEDEDE",
              boxShadow: "none",
              borderRadius: "3px",
            },
            sx: {
              borderRadius: "6px !important",
            },
          }}
        />
        <Input
          name="sendingName"
          id="sendingName"
          label="Sending name"
          value={integrationsData.sendingName}
          onChange={handleIntegrationsDataChange}
        />
        <div className="relative">
          <Input
            name="sendingEmail"
            id="sendingEmail"
            label="Sending email"
            value={integrationsData.sendingEmail}
            onChange={handleIntegrationsDataChange}
            className="pr-[150px]"
            endText={domainName ? "@laudspeaker.com" : ""}
          />
        </div>
      </>
    ),
    free3: (
      <>
        <Input
          name="testSendingName"
          id="testSendingName"
          label="Sending name"
          value={integrationsData.testSendingName}
          onChange={handleIntegrationsDataChange}
        />
        <div className="relative">
          <Input
            name="testSendingEmail"
            id="testSendingEmail"
            label="Sending email"
            value={integrationsData.testSendingEmail}
            onChange={handleIntegrationsDataChange}
            className="pr-[150px]"
            endText={domainName ? "@laudspeaker-test.com" : ""}
          />
        </div>
      </>
    ),
    sendgrid: (
      <>
        <Input
          isRequired
          value={integrationsData.sendgridApiKey}
          label="Private sendgrid API Key"
          placeholder={"****  "}
          name="sendgridApiKey"
          id="sendgridApiKey"
          type="password"
          labelClass="!text-[16px]"
          onChange={handleIntegrationsDataChange}
          onBlur={callDomains}
        />
        <Input
          isRequired
          value={integrationsData.sendgridFromEmail}
          label="Sendgrid email"
          placeholder={"your.email@sendgrid.com"}
          name="sendgridFromEmail"
          id="sendgridFromEmail"
          type="text"
          labelClass="!text-[16px]"
          onChange={handleIntegrationsDataChange}
          onBlur={callDomains}
        />
      </>
    ),
  };

  const frameOne: CSS.Properties = {
    position: "relative",
    height: "80vh",
  };

  const frameTwo: CSS.Properties = {
    height: "100%",
    width: "100%",
  };

  return (
    <>
      <div className="min-h-full">
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 pb-8">
            <div className="grid place-items-center pt-6">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 d bg-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                onClick={redirectUses}
              >
                Check Out Onboarding Video
              </button>
            </div>
            <Modal
              isOpen={nameModalOpen}
              panelClass="max-w-[90%]"
              onClose={() => {
                setNameModalOpen(false);
              }}
            >
              <div style={frameOne}>
                <iframe
                  src="https://www.loom.com/embed/be35f72bd1d04dc5a9c972d2b92c82f8"
                  frameBorder="0"
                  style={frameTwo}
                ></iframe>
              </div>
            </Modal>
            {/* Page header */}
            <div className="bg-white shadow">
              <div className="px-4 sm:px-6 lg:mx-auto lg:max-w-6xl lg:px-8"></div>
            </div>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"></div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1 p-5">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Email
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Add an email sending service to automatically send emails
                      to your customers.
                    </p>
                  </div>
                </div>
                <div className="mt-5 md:col-span-2 pd-5">
                  <form action="#" method="POST">
                    <div className="overflow-visible shadow sm:rounded-md">
                      <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                        <h2>Email configuration</h2>
                        <Select
                          id="email_config_select"
                          options={allEmailChannels.map((item) => ({
                            value: item.id,
                            title: item.title,
                            disabled:
                              item.id === "free3" && !verified
                                ? true
                                : item.disabled,
                            tooltip:
                              item.id === "free3" && !verified
                                ? "You need to verify your email"
                                : item.tooltip,
                          }))}
                          value={integrationsData.emailProvider}
                          onChange={(value: string) =>
                            setIntegrationsData({
                              ...integrationsData,
                              emailProvider: value,
                            })
                          }
                        />
                        {integrationsData.emailProvider && (
                          <>
                            <h3 className="flex items-center text-[18px] font-semibold leading-[40px] mb-[10px]">
                              {integrationsData.emailProvider
                                .charAt(0)
                                .toUpperCase() +
                                integrationsData.emailProvider.slice(1)}{" "}
                              Configuration
                            </h3>
                            {
                              parametersToConfigure[
                                integrationsData.emailProvider
                              ]
                            }
                          </>
                        )}
                      </div>
                      <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                        <button
                          id="saveEmailConfiguration"
                          type="button"
                          onClick={handleSubmit}
                          className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                  <div className="border-t border-gray-200" />
                </div>
              </div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1 p-5">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Slack
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Install the Laudspeaker Slack App to automatically send
                      triggered Slack messages to your customers.
                    </p>
                  </div>
                </div>
                <div className="mt-5 md:col-span-2 pd-5">
                  <form action="#" method="POST">
                    <div className="shadow sm:overflow-hidden sm:rounded-md">
                      <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                        <h2>Slack configuration</h2>
                        <a
                          href={slackInstallUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          <img
                            alt="add to slack"
                            src="https://platform.slack-edge.com/img/add_to_slack.png"
                            srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                            width="139"
                            height="40"
                          />
                        </a>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                  <div className="border-t border-gray-200" />
                </div>
              </div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1 p-5">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Events
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Configure your event provider to send event data to
                      Laudspeaker so you can send triggered messages.
                    </p>
                  </div>
                </div>
                <div className="mt-5 md:col-span-2 pd-5">
                  <form action="#" method="POST">
                    <div className="shadow sm:rounded-md">
                      <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                        <h2>Events configuration</h2>
                        <Select
                          id="events_config_select"
                          options={allEventChannels.map((item: any) => ({
                            value: item.id,
                            title: item.title,
                            disabled: item.disabled,
                          }))}
                          value={integrationsData.eventProvider}
                          onChange={(value: string) =>
                            setIntegrationsData({
                              ...integrationsData,
                              eventProvider: value,
                            })
                          }
                        />
                        {integrationsData.eventProvider && (
                          <>
                            <h3 className="flex items-center text-[18px] font-semibold leading-[40px] mb-[10px]">
                              {integrationsData.eventProvider
                                .charAt(0)
                                .toUpperCase() +
                                integrationsData.eventProvider.slice(1)}{" "}
                              Configuration
                            </h3>
                            {
                              parametersToConfigure[
                                integrationsData.eventProvider
                              ]
                            }
                          </>
                        )}
                      </div>
                    </div>
                  </form>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
