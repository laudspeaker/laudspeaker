/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  const colors = require("tailwindcss/colors")
  
  module.exports = {
    // ...
    theme: {
      extend: {
        colors: {
          cyan: colors.cyan,
        },
      },
    },
    plugins: [
      // ...
      require("@tailwindcss/forms"),
    ],
  }
  ```
*/
import Header from "components/Header";
import { ApiConfig } from "../../constants";
import React, { useEffect, useLayoutEffect } from "react";
import ApiService from "services/api.service";
import Input from "../../components/Elements/Input";
import Select from "../../components/Elements/Select";
import { allChannels } from "../Settings/EventsProvider";
import { useTypedSelector } from "hooks/useTypeSelector";
import {
  setDomainsList,
  setSettingData,
  setSettingsPrivateApiKey,
} from "reducers/settings";
import { useDispatch } from "react-redux";

import { Fragment, useState } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  Bars3CenterLeftIcon,
  BellIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import LaudspeakerIcon from "../../assets/images/laudspeakerIcon.svg";
import LaudspeakerWhiteIcon from "../../assets/images/laudspeakerWhiteIcon.svg";

const navigation = [
  { name: "Home", href: "#", icon: HomeIcon, current: true },
  { name: "History", href: "#", icon: ClockIcon, current: false },
  { name: "Balances", href: "#", icon: ScaleIcon, current: false },
  { name: "Cards", href: "#", icon: CreditCardIcon, current: false },
  { name: "Recipients", href: "#", icon: UserGroupIcon, current: false },
  { name: "Reports", href: "#", icon: DocumentChartBarIcon, current: false },
];
const secondaryNavigation = [
  { name: "Settings", href: "#", icon: CogIcon },
  { name: "Help", href: "#", icon: QuestionMarkCircleIcon },
  { name: "Privacy", href: "#", icon: ShieldCheckIcon },
];
const cards = [
  { name: "Account balance", href: "#", icon: ScaleIcon, amount: "$30,659.45" },
  // More items...
];
const transactions = [
  {
    id: 1,
    name: "Payment to Molly Sanders",
    href: "#",
    amount: "$20,000",
    currency: "USD",
    status: "success",
    date: "July 11, 2020",
    datetime: "2020-07-11",
  },
  // More transactions...
];
const statusStyles = {
  success: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  failed: "bg-gray-100 text-gray-800",
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface IntegrationsData {
  sendingName: string;
  sendingEmail: string;
  slackId: string;
  eventProvider: string;
}

export default function OnboardingBeta() {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);
  const [integrationsData, setIntegrationsData] = useState<IntegrationsData>({
    sendingName: "",
    sendingEmail: "",
    slackId: "",
    eventProvider: "posthog",
  });
  const dispatch = useDispatch();
  const [slackInstallUrl, setSlackInstallUrl] = useState<string>("");
  const [domainName, setDomainName] = useState<any>(settings.domainName || "");
  const [domainList, setDomainList] = useState<any>(domainsList || []);
  const [privateApiKey, setPrivateApiKey] = useState<string>(
    settings.privateApiKey || ""
  );

  const handleInputSettingsData = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };

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
      const { sendingName, sendingEmail, slackTeamId } = data;
      setIntegrationsData({
        ...integrationsData,
        sendingName,
        sendingEmail,
        slackId: slackTeamId?.[0],
      });
    })();
  }, []);

  const handleIntegrationsDataChange = (e: any) => {
    setIntegrationsData({
      ...integrationsData,
      [e.target.name]: e.target.value,
    });
  };

  const parametersToConfigure: { [key: string]: React.ReactElement } = {
    posthog: (
      <form className="grid grid-cols-6 gap-6">
        <Input
          isRequired
          value={settings.phPrivateApiKey}
          label="Private API Key"
          placeholder={"****  "}
          name="name"
          id="name"
          onChange={(e) => {
            handleInputSettingsData("phPrivateApiKey", e.target.value);
          }}
        />
        <Input
          isRequired
          value={settings.phProjectId}
          label="Project Id"
          placeholder={"****  "}
          name="name"
          id="name"
          onChange={(e) => {
            handleInputSettingsData("phProjectId", e.target.value);
          }}
        />
        <Input
          isRequired
          value={settings.phHostUrl}
          label="Posthog Url"
          placeholder={"https://app.posthog.com"}
          name="name"
          id="name"
          onChange={(e) => {
            handleInputSettingsData("phHostUrl", e.target.value);
          }}
        />
        <Input
          isRequired
          value={settings.phSms}
          label="Name of SMS / Phone number field on your Posthog person"
          placeholder={"$phoneNumber"}
          name="name"
          id="name"
          onChange={(e) => {
            handleInputSettingsData("phSms", e.target.value);
          }}
        />
        <Input
          isRequired
          value={settings.phEmail}
          label="Name of Email address field on your Posthog person"
          placeholder={"$email"}
          name="name"
          id="name"
          onChange={(e) => {
            handleInputSettingsData("phEmail", e.target.value);
          }}
        />
      </form>
    ),
  };

  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-100">
        <body class="h-full">
        ```
      */}
      <div className="min-h-full">
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 pb-8">
            {/* Page header */}
            <div className="bg-white shadow">
              <div className="px-4 sm:px-6 lg:mx-auto lg:max-w-6xl lg:px-8"></div>
            </div>
            {/*this is where we added*/}
            {/*<div className="py-6 md:justify-between lg:border-t lg:border-gray-200">*/}

            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"></div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1 p-5">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Email
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      This information will be displayed publicly so be careful
                      what you share.
                    </p>
                  </div>
                </div>
                <div className="mt-5 md:col-span-2 pd-5">
                  <form action="#" method="POST">
                    <div className="overflow-visible shadow sm:rounded-md">
                      <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                        <h2>Email configuration</h2>
                        <Input
                          name="sendingName"
                          id="sendingName"
                          label="Sending name"
                          value={integrationsData.sendingName}
                          onChange={handleIntegrationsDataChange}
                        />
                        <Input
                          name="sendingEmail"
                          id="sendingEmail"
                          label="Sending email"
                          value={integrationsData.sendingEmail}
                          onChange={handleIntegrationsDataChange}
                        />
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
                      </div>
                      <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                        <button
                          type="submit"
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
                      This information will be displayed publicly so be careful
                      what you share.
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
                      This information will be displayed publicly so be careful
                      what you share.
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
                          options={allChannels.map((item: any) => ({
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
                      type="submit"
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
