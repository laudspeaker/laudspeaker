import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import sortAscChevronsImage from "../../JourneyTablev2/svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "../../JourneyTablev2/svg/sort-desc-chevrons.svg";
import { format } from "date-fns";

enum ORGANIZATION_TABS {
  GENERAL = "General",
  TEAM = "Team members",
}

interface OrganizationData {
  organization: {
    id: string;
    name: string;
  };
  workspace: {
    id: string;
    timezoneUTCOffset: string;
  };
}

interface OrganizationTeamData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function convertOffsetStringToMinutes(offsetString: string) {
  const match = offsetString.match(/UTC([+-])(\d{2}):(\d{2})/);
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours * 60 + minutes);
  }
  return 0;
}

export function getTimezonesWithOffset() {
  const timezones = moment.tz.names();
  const timezoneMap = new Map<string, string>();

  timezones.forEach((tz) => {
    const offsetInMinutes = moment.tz(tz).utcOffset();
    const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
    const minutes = Math.abs(offsetInMinutes) % 60;
    const sign = offsetInMinutes >= 0 ? "+" : "-";

    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const offsetString = `UTC${sign}${formattedHours}:${formattedMinutes}`;

    if (!timezoneMap.has(offsetString)) {
      timezoneMap.set(offsetString, offsetString);
    }
  });

  return Array.from(timezoneMap, ([timezone, offset]) => ({
    timezone,
    offset,
  })).sort((a, b) => {
    const offsetA = convertOffsetStringToMinutes(a.timezone);
    const offsetB = convertOffsetStringToMinutes(b.timezone);
    return offsetA - offsetB;
  });
}

const timezoneList = getTimezonesWithOffset();

const OrganizationTab = () => {
  const [tab, setTab] = useState(ORGANIZATION_TABS.GENERAL);
  const [companyName, setCompanyName] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("");
  const [orgData, setOrgData] = useState<OrganizationData>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [teamData, setTeamData] = useState<OrganizationTeamData[]>([]);
  const [skip, setSkip] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isASC, setIsASC] = useState(false);

  const isSame =
    orgData?.organization?.name === companyName &&
    orgData.workspace.timezoneUTCOffset === selectedTimeZone;

  const loadOrganization = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<OrganizationData>({
        url: "/organizations",
      });
      setOrgData(data);
      setCompanyName(data.organization.name || "");
      setSelectedTimeZone(data.workspace.timezoneUTCOffset || "");
    } catch (error) {
      toast.error("Error getting organization data");
    }
    setIsLoading(false);
  };

  const loadTeams = async () => {
    try {
      setIsLoadingMembers(true);
      const { data } = await ApiService.get({
        url: `/organizations/team-members?take=10&skip=${skip}&isASC=${isASC}`,
      });
      setPageCount(data.pageCount);
      setTeamData(data.data);
      setIsLoadingMembers(false);
    } catch (error) {}
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/organizations",
        options: {
          name: companyName,
          timezoneUTCOffset: selectedTimeZone,
        },
      });
    } catch (error) {
      toast.error("Error updating organization data");
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setCompanyName(orgData?.organization?.name || "");
    setSelectedTimeZone(orgData?.workspace?.timezoneUTCOffset || "");
  };

  useEffect(() => {
    loadOrganization();
    loadTeams();
  }, []);

  return (
    <div
      className={`${
        (isLoading || isLoadingMembers) &&
        "opacity-70 animation-pulse pointer-events-none"
      } p-5 pt-[10px]`}
    >
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
            value={companyName || orgData?.organization.name || ""}
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
            value={
              selectedTimeZone || orgData?.workspace.timezoneUTCOffset || ""
            }
            placeholder="Select timezone"
            options={timezoneList.map((el) => ({
              key: el.offset,
              title: el.offset,
            }))}
            onChange={setSelectedTimeZone}
          />
          <hr className="border-[#E5E7EB] my-5" />
          <div className="flex gap-[10px]">
            <Button
              disabled={isLoading || isSame}
              type={ButtonType.PRIMARY}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              disabled={isLoading || isSame}
              type={ButtonType.SECONDARY}
              onClick={handleCancel}
            >
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
          <table className="mt-[10px] min-w-full border-separate border-spacing-0">
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
                  Email
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
            <tbody>
              {teamData.map((member, memberIndex, arr) => (
                <tr key={memberIndex}>
                  <td
                    className={`border-b cursor-pointer border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter text-[#6366F1] sm:pl-6 lg:pl-8`}
                  >
                    {member.name}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter sm:table-cell`}
                  >
                    {member.email}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis px-5 py-4 text-sm font-inter lg:table-cell`}
                  >
                    {format(new Date(member.createdAt), "MM/dd/yyyy HH:mm")}
                  </td>
                  <td
                    className={`border-b border-gray-200 whitespace-nowrap px-5 py-4 text-sm text-gray-500`}
                  ></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrganizationTab;
