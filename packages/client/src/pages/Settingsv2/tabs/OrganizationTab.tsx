import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import ApiService from "services/api.service";
import Account from "types/Account";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

enum ORGANIZATION_TABS {
  GENERAL = "General",
  TEAM = "Team members",
}

const timezoneList = [
  "UTC+00:00",
  "UTC+00:30",
  "UTC+01:00",
  "UTC+01:30",
  "UTC+02:00",
  "UTC+02:30",
  "UTC+03:00",
  "UTC+03:30",
  "UTC+04:00",
  "UTC+04:30",
  "UTC+05:00",
  "UTC+05:30",
  "UTC+06:00",
  "UTC+06:30",
  "UTC+07:00",
  "UTC+07:30",
  "UTC+08:00",
  "UTC+08:30",
  "UTC+09:00",
  "UTC+09:30",
  "UTC+10:00",
  "UTC+10:30",
  "UTC+11:00",
  "UTC+11:30",
  "UTC+12:00",
  "UTC+12:30",
  "UTC+13:00",
  "UTC+13:30",
  "UTC+14:00",
  "UTC+14:30",
  "UTC+15:00",
  "UTC+15:30",
  "UTC+16:00",
  "UTC+16:30",
  "UTC+17:00",
  "UTC+17:30",
  "UTC+18:00",
  "UTC+18:30",
  "UTC+19:00",
  "UTC+19:30",
  "UTC+20:00",
  "UTC+20:30",
  "UTC+21:00",
  "UTC+21:30",
  "UTC+22:00",
  "UTC+22:30",
  "UTC+23:00",
  "UTC+23:30",
];

const OrganizationTab = () => {
  const [tab, setTab] = useState(ORGANIZATION_TABS.GENERAL);
  const [companyName, setCompanyName] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("");

  const loadData = async () => {
    try {
      const {
        data: { timezoneUTCOffset },
      } = await ApiService.get<Account>({ url: "/accounts" });
      setSelectedTimeZone(timezoneUTCOffset);
    } catch (e) {
      toast.error("Error while loading data");
    }
  };

  const onSave = async () => {
    try {
      await ApiService.patch<Account>({
        url: "/accounts/timezone",
        options: {
          timezoneUTCOffset: selectedTimeZone,
        },
      });
      toast.success("Successfully saved timezone!");
    } catch (e) {
      let message = "Something went wrong saving the timezone...";
      if (e instanceof AxiosError) {
        message = e.response?.data?.message || message;
      }
      toast.error(message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
              key: el,
              title: el,
            }))}
            onChange={setSelectedTimeZone}
          />
          <hr className="border-[#E5E7EB] my-5" />
          <div className="flex gap-[10px]">
            <Button type={ButtonType.PRIMARY} onClick={onSave}>
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
