import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { Fragment, useEffect, useState } from "react";
import moment from "moment-timezone";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import sortAscChevronsImage from "../../JourneyTablev2/svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "../../JourneyTablev2/svg/sort-desc-chevrons.svg";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Pagination from "components/Pagination";
import { Menu, Transition } from "@headlessui/react";
import { useAppSelector } from "store/hooks";
import { confirmAlert } from "react-confirm-alert";

enum ORGANIZATION_TABS {
  GENERAL = "General",
  TEAM = "Team members",
}

interface OrganizationData {
  organization: {
    id: string;
    name: string;
    ownerId: string;
  };
  workspace: {
    id: string;
    timezoneUTCOffset: string;
  };
}

export interface OrganizationTeamData {
  id: string;
  name: string;
  lastName: string;
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

interface OrganizationTabProps {
  setViewTeamMember: (val: OrganizationTeamData) => void;
}

const OrganizationTab = ({ setViewTeamMember }: OrganizationTabProps) => {
  const { uId } = useAppSelector((state) => state.auth.userData);
  const [tab, setTab] = useState(ORGANIZATION_TABS.GENERAL);
  const [companyName, setCompanyName] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("");
  const [orgData, setOrgData] = useState<OrganizationData>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [teamData, setTeamData] = useState<OrganizationTeamData[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [isASC, setIsASC] = useState(false);
  const navigate = useNavigate();
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
        url: `/organizations/team-members?take=10&skip=${
          page === 1 ? 0 : (page - 1) * 10
        }&isASC=${isASC}`,
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

  const handleTransferOwner = (accountMemberId: string) => () => {
    confirmAlert({
      title: "Confirm transfer ownership!",
      message: "Are you sure you want to transfer ownership?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsLoading(true);
            try {
              await ApiService.post({
                url: `/organizations/transfer-owner-rights/${accountMemberId}`,
              });
              await loadOrganization();
              await loadTeams();
            } catch (error) {
              toast.error("Error transfer ownership.");
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

  const handleDeleteMember = (accountMemberId: string) => () => {
    confirmAlert({
      title: "Confirm delete member.",
      message: "Are you sure you want to delete member?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsLoading(true);
            try {
              await ApiService.delete({
                url: `/organizations/delete-member/${accountMemberId}`,
              });
              if (uId === accountMemberId) {
                localStorage.removeItem("userData");
                document.cookie = "";
                window.location.reload();
                navigate("/");
                return;
              }
              await loadOrganization();
              await loadTeams();
            } catch (error) {
              toast.error("Error deleting account.");
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

  const handleCancel = () => {
    setCompanyName(orgData?.organization?.name || "");
    setSelectedTimeZone(orgData?.workspace?.timezoneUTCOffset || "");
  };

  useEffect(() => {
    loadOrganization();
    loadTeams();
  }, []);

  useEffect(() => {
    loadTeams();
  }, [isASC, page]);

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
            Set your organization's time zone to ensure accuracy of time-based
            features.
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
            <Button
              disabled={false}
              type={ButtonType.PRIMARY}
              onClick={() => {
                navigate("/settings/add-member");
              }}
            >
              Add team member
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
                    onClick={() => {
                      setViewTeamMember(member);
                    }}
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
                  >
                    <div
                      className={`${
                        member.id === orgData?.organization.ownerId &&
                        "disabled:opacity-50 grayscale !cursor-not-allowed"
                      } p-3 cursor-pointer`}
                    >
                      <Menu as="div" className="relative">
                        <Menu.Button>
                          <button
                            disabled={
                              member.id === orgData?.organization.ownerId
                            }
                            className="px-[5px] py-[11px] rounded disabled:!cursor-not-allowed"
                          >
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
                        {member.id !== orgData?.organization.ownerId && (
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
                              {uId === orgData?.organization.ownerId && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      className={`block w-full text-left py-[5px] px-[12px] text-[#111827] ${
                                        active ? "bg-[#F3F4F6]" : ""
                                      }`}
                                      onClick={handleTransferOwner(member.id)}
                                    >
                                      Transfer rights
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                              {(uId === orgData?.organization.ownerId ||
                                member.id === uId) && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      className={`block w-full text-left py-[5px] px-[12px] text-[#F43F5E] ${
                                        active ? "bg-[#F3F4F6]" : ""
                                      }`}
                                      onClick={handleDeleteMember(member.id)}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </Menu.Items>
                          </Transition>
                        )}
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
    </div>
  );
};

export default OrganizationTab;
