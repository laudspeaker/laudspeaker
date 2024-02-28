import React, { FC } from "react";
import { SettingsTab } from "./Settingsv2";

interface SettingsStepperProps {
  currentTab: SettingsTab;
  setCurrentTab: (value: SettingsTab) => void;
}

const SettingsStepper: FC<SettingsStepperProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const settingsTabsToShow: SettingsTab[] = [
    SettingsTab.ACCOUNT,
    SettingsTab.MESSAGE_CHANNEL,
    SettingsTab.EVENT_PROVIDER,
    SettingsTab.API,
    SettingsTab.ORGANIZATION,
    // Removed for 1 release
    // SettingsTab.PLAN,
    // SettingsTab.BILLING,
    // SettingsTab.TEAM,
  ];

  const settingsTabToNameMap: { [key: number]: string } = {
    [SettingsTab.ACCOUNT]: "Account",
    [SettingsTab.MESSAGE_CHANNEL]: "Message Channels",
    [SettingsTab.EVENT_PROVIDER]: "Event provider",
    [SettingsTab.API]: "API",
    [SettingsTab.ORGANIZATION]: "Organization",
    // Removed for 1 release
    // [SettingsTab.PLAN]: "Plan",
    // [SettingsTab.BILLING]: "Billing",
    // [SettingsTab.TEAM]: "Team",
  };

  return (
    <div className="max-w-[970px] w-full bg-white rounded-t-[4px] px-[16px] flex gap-[32px]">
      {settingsTabsToShow.map((settingsTab, i) => (
        <button
          key={i}
          className={`py-[12px] select-none ${
            settingsTab === currentTab
              ? "text-[#6366F1] border-b-2 border-[#6366F1]"
              : ""
          }`}
          onClick={() => setCurrentTab(settingsTab)}
        >
          {settingsTabToNameMap[settingsTab]}
        </button>
      ))}
    </div>
  );
};

export default SettingsStepper;
