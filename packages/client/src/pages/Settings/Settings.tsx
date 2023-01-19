import Header from "components/Header";
import React, { useState } from "react";
import SettingsAPIBeta from "./SettingsAPIBeta";
import SettingsBillingBeta from "./SettingsBillingBeta";
import SettingsEmailBeta from "./SettingsEmailBeta";
import SettingsEventsBeta from "./SettingsEventsBeta";
import SettingsGeneralBeta from "./SettingsGeneralBeta";
import SettingsPlanBeta from "./SettingsPlanBeta";
import SettingsSlackBeta from "./SettingsSlackBeta";
import SettingsSMSBeta from "./SettingsSMSBeta";
import SettingsTeamBeta from "./SettingsTeamBeta";

const tabComponents = {
  Account: <SettingsGeneralBeta />,
  API: <SettingsAPIBeta />,
  Email: <SettingsEmailBeta />,
  SMS: <SettingsSMSBeta />,
  Slack: <SettingsSlackBeta />,
  Events: <SettingsEventsBeta />,
  Plan: <SettingsPlanBeta />,
  Billing: <SettingsBillingBeta />,
  "Team Members": <SettingsTeamBeta />,
};

type TabName = keyof typeof tabComponents;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Settings = () => {
  const [currentTab, setCurrentTab] = useState<TabName>("Account");

  return (
    <div>
      {/* Content area */}
      <div className="">
        <div className="mx-auto flex flex-col">
          <Header />
          <main>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="pt-10 pb-16">
                <div className="px-4 sm:px-6 md:px-0">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Settings
                  </h1>
                </div>
                <div className="px-4 sm:px-6 md:px-0">
                  <div className="py-6">
                    <div className="lg:hidden">
                      <label htmlFor="selected-tab" className="sr-only">
                        Select a tab
                      </label>
                      <select
                        id="selected-tab"
                        name="selected-tab"
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                        value={currentTab}
                        onChange={(e) =>
                          setCurrentTab(e.currentTarget.value as TabName)
                        }
                      >
                        {Object.keys(tabComponents).map((tab) => (
                          <option key={tab} value={tab}>
                            {tab}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="hidden lg:block">
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                          {Object.keys(tabComponents).map((tab) => (
                            <div
                              key={tab}
                              className={classNames(
                                tab === currentTab
                                  ? "border-cyan-500 text-cyan-600"
                                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer"
                              )}
                              onClick={() => setCurrentTab(tab as TabName)}
                            >
                              {tab}
                            </div>
                          ))}
                        </nav>
                      </div>
                    </div>
                    {tabComponents[currentTab]}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
