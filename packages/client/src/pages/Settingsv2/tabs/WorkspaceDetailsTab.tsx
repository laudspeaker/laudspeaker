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

interface WorkspaceData {
  id: string;
  name: string;
  timezoneUTCOffset: string;
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

const WorkspaceDetailsTab = () => {
  const { uId } = useAppSelector((state) => state.auth.userData);
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("");
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isSame =
    workspaceData?.name === workspaceName &&
    workspaceData.timezoneUTCOffset === selectedTimeZone;

  const loadCurrentWorkspace = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<{ workspace: WorkspaceData }>({
        url: "/accounts",
      });
      setWorkspaceData(data.workspace);
      setWorkspaceName(data.workspace.name || "");
      setSelectedTimeZone(data.workspace.timezoneUTCOffset || "");
    } catch (error) {
      toast.error("Error getting organization data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/workspaces",
        options: {
          name: workspaceName,
          timezoneUTCOffset: selectedTimeZone,
        },
      });
    } catch (error) {
      toast.error("Error updating organization data");
    }
    window.location.reload();
  };

  const handleCancel = () => {
    setWorkspaceName(workspaceData?.name || "");
    setSelectedTimeZone(workspaceData?.timezoneUTCOffset || "");
  };

  useEffect(() => {
    loadCurrentWorkspace();
  }, []);

  return (
    <div
      className={`${
        isLoading && "opacity-70 animation-pulse pointer-events-none"
      } p-5 pt-[10px]`}
    >
      <div className="mt-5">
        <p className="text-base mb-[10px] text-[#111827] font-inter font-semibold">
          Workspace name
        </p>
        <Input
          className="!w-full"
          wrapperClassName="!max-w-[300px] !w-full"
          placeholder="Insert company name"
          value={workspaceName || workspaceData?.name || ""}
          onChange={setWorkspaceName}
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
          value={selectedTimeZone || workspaceData?.timezoneUTCOffset || ""}
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
    </div>
  );
};

export default WorkspaceDetailsTab;
