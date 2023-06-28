import { Menu, Transition } from "@headlessui/react";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Table from "components/Tablev2";
import { format } from "date-fns";
import React, { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";
import { Workflow } from "types/Workflow";
import NameJourneyModal from "./Modals/NameJourneyModal";
import searchIconImage from "./svg/search-icon.svg";
import threeDotsIcon from "./svg/three-dots-icon.svg";
import noJourneysBackgroundImage from "./svg/no-journeys-background.svg";

enum FilterOption {
  ALL,
  ACTIVE,
  DRAFT,
  PAUSED,
  STOPPED,
}

const filterOptionToTextMap: Record<FilterOption, string> = {
  [FilterOption.ALL]: "All",
  [FilterOption.ACTIVE]: "Active",
  [FilterOption.DRAFT]: "Draft",
  [FilterOption.PAUSED]: "Paused",
  [FilterOption.STOPPED]: "Stopped",
};

const filterOptionsToRender: FilterOption[] = [
  FilterOption.ALL,
  FilterOption.ACTIVE,
  FilterOption.DRAFT,
  FilterOption.PAUSED,
  FilterOption.STOPPED,
];

export type ChosenFilter =
  | FilterOption.ALL
  | Exclude<FilterOption, FilterOption.ALL>[];

interface JourneyRowData {
  id: string;
  name: string;
  status: JourneyStatus;
  enrolledCount: number;
  lastUpdate: string;
}

export enum JourneyStatus {
  ACTIVE = "Active",
  PAUSED = "Paused",
  STOPPED = "Stopped",
  DELETED = "Deleted",
  DRAFT = "Draft",
}

export const journeyStatusClassName: Record<JourneyStatus, string> = {
  [JourneyStatus.ACTIVE]: "bg-[#DCFCE7] text-[#14532D]",
  [JourneyStatus.DELETED]: "",
  [JourneyStatus.DRAFT]: "bg-[#E0F2FE] text-[#0C4A6E]",
  [JourneyStatus.PAUSED]: "bg-[#FEF9C3] text-[#713F12]",
  [JourneyStatus.STOPPED]: "bg-[#F3F4F6] text-[#6B7280]",
};

const filterOptionToJourneyStatusMap: Record<
  Exclude<FilterOption, FilterOption.ALL>,
  JourneyStatus
> = {
  [FilterOption.ACTIVE]: JourneyStatus.ACTIVE,
  [FilterOption.DRAFT]: JourneyStatus.DRAFT,
  [FilterOption.PAUSED]: JourneyStatus.PAUSED,
  [FilterOption.STOPPED]: JourneyStatus.STOPPED,
};

const ITEMS_PER_PAGE = 10;

const JourneyTablev2 = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [chosenFilter, setChosenFilter] = useState<ChosenFilter>(
    FilterOption.ALL
  );
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<JourneyRowData[]>([]);
  const [isNameJourneyModalOpen, setIsNameJourneyModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const {
        data: { data, totalPages },
      } = await ApiService.get<{ data: Workflow[]; totalPages: number }>({
        url: `/journeys?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&search=${search}${
          chosenFilter === FilterOption.ALL
            ? ""
            : `&filterStatuses=${chosenFilter
                .map((filter) => filterOptionToJourneyStatusMap[filter])
                .join(",")}`
        }`,
      });

      setRows(
        data.map((workflow) => {
          let status: JourneyStatus = JourneyStatus.DRAFT;

          if (workflow.isActive) status = JourneyStatus.ACTIVE;
          if (workflow.isPaused) status = JourneyStatus.PAUSED;
          if (workflow.isStopped) status = JourneyStatus.STOPPED;
          if (workflow.isDeleted) status = JourneyStatus.DELETED;

          return {
            id: workflow.id,
            name: workflow.name,
            status,
            enrolledCount: 0,
            lastUpdate: workflow.latestSave,
          };
        })
      );
      setPagesCount(totalPages);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [chosenFilter, search, currentPage]);

  useEffect(() => {
    setSearch("");
  }, [showSearch]);

  useDebounce(
    () => {
      loadData();
    },
    500,
    [search]
  );

  const handleChangeChosenFilter = (filterOption: FilterOption) => {
    if (filterOption === FilterOption.ALL) {
      setChosenFilter(FilterOption.ALL);
      return;
    }

    if (chosenFilter === FilterOption.ALL) {
      setChosenFilter([filterOption]);
      return;
    }

    const newChosenFilter = [...chosenFilter];
    if (chosenFilter.includes(filterOption)) {
      newChosenFilter.splice(newChosenFilter.indexOf(filterOption), 1);

      setChosenFilter(
        newChosenFilter.length > 0 ? newChosenFilter : FilterOption.ALL
      );

      return;
    }

    newChosenFilter.push(filterOption);

    setChosenFilter(newChosenFilter);
  };

  const duplicateJourney = async (id: string) => {
    await ApiService.post({ url: "/journeys/duplicate/" + id });
    await loadData();
  };

  const deleteJourney = async (id: string) => {
    await ApiService.patch({ url: "/journeys/delete/" + id });
    await loadData();
  };

  return (
    <div className="bg-[#F3F4F6] p-[20px] flex flex-col gap-[20px] font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex justify-between">
        <div className="text-[20px] font-semibold leading-[28px]">Journeys</div>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => setIsNameJourneyModalOpen(true)}
        >
          Create journey
        </Button>
      </div>

      <div className="p-[20px] rounded-[8px] bg-white flex flex-col gap-[20px]">
        {rows.length === 0 &&
        chosenFilter === FilterOption.ALL &&
        search === "" ? (
          <div className="w-full h-[300px] flex items-center justify-center select-none">
            <div>
              <img src={noJourneysBackgroundImage} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="flex gap-[10px]">
                {filterOptionsToRender.map((filterOption, i) => (
                  <button
                    className={`px-[12px] py-[5px] rounded-[4px] ${
                      (chosenFilter === FilterOption.ALL &&
                        filterOption === FilterOption.ALL) ||
                      (chosenFilter !== FilterOption.ALL &&
                        filterOption !== FilterOption.ALL &&
                        chosenFilter.includes(filterOption))
                        ? "border-[1px] border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]"
                        : ""
                    }`}
                    onClick={() => handleChangeChosenFilter(filterOption)}
                    key={i}
                  >
                    {filterOptionToTextMap[filterOption]}
                  </button>
                ))}
              </div>

              {showSearch ? (
                <div className="flex gap-[10px] items-center">
                  <Input
                    value={search}
                    onChange={setSearch}
                    placeholder="Search all journeys"
                    showClearButton
                  />

                  <Button
                    type={ButtonType.LINK}
                    onClick={() => setShowSearch(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button onClick={() => setShowSearch(true)}>
                  <img src={searchIconImage} />
                </button>
              )}
            </div>

            <Table
              isLoading={isLoading}
              headings={[
                <div>Name</div>,
                <div>Status</div>,
                <div>Enrolled customer</div>,
                <div>Last update</div>,
                <div></div>,
              ]}
              rows={rows.map((row) => [
                <button
                  className="text-[#6366F1]"
                  onClick={() => navigate("/flow/" + row.id)}
                >
                  {row.name}
                </button>,
                <div
                  className={`px-[10px] py-[2px] rounded-[14px] w-fit ${
                    journeyStatusClassName[row.status]
                  }`}
                >
                  {row.status}
                </div>,
                <div>
                  {row.status === JourneyStatus.DRAFT ? (
                    "-"
                  ) : (
                    <>{row.enrolledCount} persons</>
                  )}
                </div>,
                <div>
                  {format(new Date(row.lastUpdate), "MM/dd/yyyy hh:mm")}
                </div>,
                <Menu as="div" className="relative">
                  <Menu.Button>
                    <button className="px-[5px] py-[11px] rounded-[4px]">
                      <img src={threeDotsIcon} />
                    </button>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute z-[120] right-0 origin-top-right w-[200px] h-[72px] py-[4px] rounded-[2px] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`block w-full text-left py-[5px] px-[12px] ${
                              active ? "bg-[#F3F4F6]" : ""
                            }`}
                            onClick={() => duplicateJourney(row.id)}
                          >
                            Duplicate
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`block w-full text-left py-[5px] px-[12px] text-[#F43F5E] ${
                              active ? "bg-[#F3F4F6]" : ""
                            }`}
                            onClick={() => deleteJourney(row.id)}
                          >
                            Delete
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>,
              ])}
            />
          </>
        )}
      </div>

      <NameJourneyModal
        isOpen={isNameJourneyModalOpen}
        onClose={() => setIsNameJourneyModalOpen(false)}
      />
    </div>
  );
};

export default JourneyTablev2;
