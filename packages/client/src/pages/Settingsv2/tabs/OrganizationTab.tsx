import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { useState } from "react";
import moment from "moment-timezone";
import Button, { ButtonType } from "components/Elements/Buttonv2";

enum ORGANIZATION_TABS {
  GENERAL = "General",
  TEAM = "Team members",
}

function getTimezonesWithOffset() {
  const timezones = moment.tz.names();
  const timezoneMap = new Map<number, string>();

  timezones.forEach((tz) => {
    const offsetInMinutes = moment.tz(tz).utcOffset();
    const offsetHours = offsetInMinutes / 60;
    const offsetString = "UTC " + (offsetHours >= 0 ? "+" : "") + offsetHours;

    if (!timezoneMap.has(offsetInMinutes)) {
      timezoneMap.set(offsetInMinutes, offsetString);
    }
  });

  return Array.from(timezoneMap, ([offset, timezone]) => ({
    timezone,
    offset,
  })).sort((a, b) => a.offset - b.offset);
}

const timezoneList = getTimezonesWithOffset();

const OrganizationTab = () => {
  const [tab, setTab] = useState(ORGANIZATION_TABS.GENERAL);
  const [companyName, setCompanyName] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState(
    new Date().getTimezoneOffset()
  );

  return (
    <div className="p-5 pt-[10px]">
      <div className="relative flex gap-8">
        {Object.values(ORGANIZATION_TABS).map((el) => (
          <div
            key={el}
            className={`${
              tab == el && "text-[#6366F1] !border-b-[#6366F1]"
            } text-[#000000D9] border-b-transparent border-b-[2px] transition-all text-sm font-roboto cursor-pointer pb-2`}
            onClick={() => setTab(el as ORGANIZATION_TABS)}
          >
            {el}
          </div>
        ))}
        <div className="absolute w-[calc(100%+40px)] -left-5 bottom-0 border-[#E5E7EB] border-t"></div>
      </div>
      {tab === ORGANIZATION_TABS.GENERAL ? (
        <div className="mt-5">
          <p className="text-base mb-[10px] text-[#111827] font-inter font-semibold">
            Company name
          </p>
          <Input
            className="!w-full"
            wrapperClassName="!max-w-[300px] !w-full"
            placeholder="Insert company name"
            value={companyName}
            onChange={setCompanyName}
          />

          <p className="text-base mt-5 text-[#111827] font-inter font-semibold">
            Time zone
          </p>
          <div className="text-xs mb-[5px] mt-[10px] font-inter text-[#4B5563]">
            Description description description
          </div>
          <Select
            className="max-w-[300px]"
            value={selectedTimeZone}
            placeholder="Select timezone"
            options={timezoneList.map((el) => ({
              key: el.offset,
              title: el.timezone,
            }))}
            onChange={setSelectedTimeZone}
          />
          <hr className="border-[#E5E7EB] my-5" />
          <div className="flex gap-[10px]">
            <Button disabled type={ButtonType.PRIMARY} onClick={() => {}}>
              Save
            </Button>
            <Button disabled type={ButtonType.SECONDARY} onClick={() => {}}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-base  text-[#111827] font-inter font-semibold">
              Team members
            </p>
            <Button disabled type={ButtonType.PRIMARY} onClick={() => {}}>
              Add team member
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationTab;
