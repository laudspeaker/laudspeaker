import React, { ReactNode, useMemo, useState } from "react";
import SettingsStepper from "./SettingsStepper";
import SetupGuide from "./SetupGuide";
import AccountTab from "./tabs/AccountTab";
import APITab from "./tabs/APITab";
import BillingTab from "./tabs/BillingTab";
import EventProviderTab from "./tabs/EventProviderTab";
import MessageChannelTab from "./tabs/MessageChannelTab";
import PlanTab from "./tabs/PlanTab";
import TeamTab from "./tabs/TeamTab";
import OrganizationTab, { OrganizationTeamData } from "./tabs/OrganizationTab";
import BackButton from "components/BackButton";
import Input from "components/Elements/Inputv2";
import FrequencyCappingTab from "./tabs/FrequecyCappingTab";
import { FrequencyCappingModal } from "components/FrequencyCappingModal/FrequencyCappingModal";
import { useLocation } from "react-router-dom";

export enum SettingsTab {
  ACCOUNT,
  MESSAGE_CHANNEL,
  EVENT_PROVIDER,
  API,
  PLAN,
  BILLING,
  TEAM,
  ORGANIZATION,
  FREQUENCY_CAPPING,
}

const Settingsv2 = () => {
  const { search } = useLocation();
  const searchTab: SettingsTab = search?.split("=")[1];
  const [currentTab, setCurrentTab] = useState(
    searchTab ? SettingsTab[searchTab] : SettingsTab.ACCOUNT
  );
  const [viewTeamMember, setViewTeamMember] = useState<OrganizationTeamData>();
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => {
    setShowModal(!showModal);
  };

  const settingsTabToComponentMap = useMemo<{ [key: number]: ReactNode }>(
    () => ({
      [SettingsTab.ACCOUNT]: <AccountTab />,
      [SettingsTab.FREQUENCY_CAPPING]: (
        <FrequencyCappingTab handleShowModal={handleShowModal} />
      ),
      [SettingsTab.MESSAGE_CHANNEL]: <MessageChannelTab />,
      [SettingsTab.EVENT_PROVIDER]: <EventProviderTab />,
      [SettingsTab.API]: <APITab />,
      [SettingsTab.ORGANIZATION]: (
        <OrganizationTab setViewTeamMember={setViewTeamMember} />
      ),
      // Removed for 1 release
      // [SettingsTab.PLAN]: <PlanTab />,
      // [SettingsTab.BILLING]: <BillingTab />,
      // [SettingsTab.TEAM]: <TeamTab />,
    }),
    [viewTeamMember, currentTab]
  );

  return (
    <div className="w-full flex flex-col gap-5 items-center p-5 font-roboto text-[14px] font-normal leading-[22px] text-[#111827]">
      {viewTeamMember ? (
        <>
          <div className="max-w-[970px] w-full flex flex-col gap-5">
            <div className="flex gap-[15px] items-center">
              <BackButton onClick={() => setViewTeamMember(undefined)} />
              <div className="text-[20px] font-semibold leading-[28px] text-black">
                {viewTeamMember.name} {viewTeamMember.lastName}
              </div>
            </div>

            <div className="bg-white p-5 flex-col">
              <div className="flex justify-center gap-5 w-full">
                <div className="flex flex-col w-full">
                  <div className="text-sm font-inter text-[#111827] mb-[5px]">
                    First name
                  </div>
                  <Input
                    onChange={() => {}}
                    value={viewTeamMember.name}
                    placeholder="No first name"
                    wrapperClassName="!max-w-full w-full"
                    className="w-full !bg-[#F3F4F6]"
                    disabled
                  />
                </div>
                <div className="flex flex-col w-full">
                  <div className="text-sm font-inter text-[#111827] mb-[5px]">
                    Last name
                  </div>
                  <Input
                    onChange={() => {}}
                    value={viewTeamMember.lastName}
                    placeholder="No last name"
                    wrapperClassName="!max-w-full w-full"
                    className="w-full !bg-[#F3F4F6]"
                    disabled
                  />
                </div>
              </div>
              <div className="text-sm font-inter text-[#111827] mb-[5px]  mt-[10px]">
                Email
              </div>
              <Input
                onChange={() => {}}
                value={viewTeamMember.email}
                placeholder="No email"
                wrapperClassName="!max-w-full w-full"
                className="w-full !bg-[#F3F4F6]"
                disabled
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="max-w-[970px] w-full font-inter text-[20px] font-medium leading-[28px] text-black">
            Settings
          </div>
          <div className="w-full flex flex-col items-center gap-[10px]">
            <SettingsStepper
              currentTab={currentTab as SettingsTab}
              setCurrentTab={setCurrentTab}
            />

            <div className="max-w-[970px] w-full rounded-b-[4px] bg-white">
              {settingsTabToComponentMap[currentTab as SettingsTab]}
            </div>
          </div>
        </>
      )}

      <FrequencyCappingModal
        handleShowModal={handleShowModal}
        showModal={showModal}
      />

      {/* <SetupGuide currentTab={currentTab} setCurrentTab={setCurrentTab} /> */}
    </div>
  );
};

export default Settingsv2;
