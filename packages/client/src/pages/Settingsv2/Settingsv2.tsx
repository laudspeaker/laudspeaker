import React, { ReactNode, useState } from "react";
import SettingsStepper from "./SettingsStepper";
import SetupGuide from "./SetupGuide";
import AccountTab from "./tabs/AccountTab";
import APITab from "./tabs/APITab";
import BillingTab from "./tabs/BillingTab";
import EventProviderTab from "./tabs/EventProviderTab";
import MessageChannelTab from "./tabs/MessageChannelTab";
import PlanTab from "./tabs/PlanTab";
import TeamTab from "./tabs/TeamTab";

export enum SettingsTab {
  ACCOUNT,
  MESSAGE_CHANNEL,
  EVENT_PROVIDER,
  API,
  PLAN,
  BILLING,
  TEAM,
}

const settingsTabToComponentMap: Record<SettingsTab, ReactNode> = {
  [SettingsTab.ACCOUNT]: <AccountTab />,
  [SettingsTab.MESSAGE_CHANNEL]: <MessageChannelTab />,
  [SettingsTab.EVENT_PROVIDER]: <EventProviderTab />,
  [SettingsTab.API]: <APITab />,
  [SettingsTab.PLAN]: <PlanTab />,
  [SettingsTab.BILLING]: <BillingTab />,
  [SettingsTab.TEAM]: <TeamTab />,
};

const Settingsv2 = () => {
  const [currentTab, setCurrentTab] = useState(SettingsTab.ACCOUNT);

  return (
    <div className="w-full flex flex-col gap-[20px] items-center p-[20px] font-roboto text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full font-inter text-[20px] font-medium leading-[28px] text-black">
        Settings
      </div>
      <div className="w-full flex flex-col items-center gap-[10px]">
        <SettingsStepper
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />

        <div className="max-w-[970px] w-full rounded-b-[4px] bg-white">
          {settingsTabToComponentMap[currentTab]}
        </div>
      </div>

      {/* <SetupGuide currentTab={currentTab} setCurrentTab={setCurrentTab} /> */}
    </div>
  );
};

export default Settingsv2;
