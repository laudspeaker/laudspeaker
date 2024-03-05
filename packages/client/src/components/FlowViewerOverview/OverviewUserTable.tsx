import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import { getUsers, UserStatus } from "utils/flowBuilderOverviewMockData";
import searchIconImage from "../../pages/JourneyTablev2/svg/search-icon.svg";
import emptyDataImage from "../../pages/JourneyTablev2/svg/empty-data.svg";
import sortAscChevronsImage from "../../pages/JourneyTablev2/svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "../../pages/JourneyTablev2/svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "../../pages/JourneyTablev2/svg/sort-none-chevrons.svg";
import Pagination from "components/Pagination";

enum FilterOption {
  ALL,
  IN_PROGRESS,
  FINISHED,
  STOPPED,
}

const filterOptionToTextMap: Record<FilterOption, string> = {
  [FilterOption.ALL]: "All",
  [FilterOption.IN_PROGRESS]: "In Progress",
  [FilterOption.FINISHED]: "Finished",
  [FilterOption.STOPPED]: "Stopped",
};

const filterOptionsToRender: FilterOption[] = [
  FilterOption.ALL,
  FilterOption.IN_PROGRESS,
  FilterOption.FINISHED,
  FilterOption.STOPPED,
];

export type ChosenFilter =
  | FilterOption.ALL
  | Exclude<FilterOption, FilterOption.ALL>[];

interface UserRowData {
  customerId: string;
  email: string;
  status: UserStatus;
  lastUpdate: string;
}

export const userStatusClassName: Record<UserStatus, string> = {
  [UserStatus.ENROLLED]: "bg-[#DCFCE7] text-[#14532D]",
  [UserStatus.FINISHED]: "bg-[#F3F4F6] text-[#4B5563]",
};

enum SortProperty {
  STATUS = "status",
  LAST_UPDATE = "latestSave",
}

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
}

const OverviewUserTable = () => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chosenFilter, setChosenFilter] = useState<ChosenFilter>(
    FilterOption.ALL
  );
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<UserRowData[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.LAST_UPDATE,
    sortType: SortType.DESC,
  });

  const loadData = async () => {
    setIsLoading(true);

    try {
      const {
        data: { data, totalPages },
      } = getUsers(); // Filter and sort will be integrated into the API call

      setRows(data);
      setPagesCount(totalPages);
      setIsLoaded(true);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [chosenFilter, search, currentPage, sortOptions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [chosenFilter, search, sortOptions]);

  useEffect(() => {
    setSearch("");
  }, [showSearch]);

  useDebounce(
    () => {
      if (isFirstRender) {
        setIsFirstRender(false);
        return;
      }
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

  const sortImage = (column: SortProperty) =>
    sortOptions.sortBy === column
      ? sortOptions.sortType === SortType.ASC
        ? sortAscChevronsImage
        : sortDescChevronsImage
      : sortNoneChevronsImage;

  return (
    <div className="font-inter text-sm flex flex-col gap-5">
      {rows.length === 0 &&
      chosenFilter === FilterOption.ALL &&
      search === "" &&
      isLoaded ? (
        <div className="w-full h-[300px] flex items-center justify-center select-none">
          <div className="flex flex-col items-center gap-5">
            <img src={emptyDataImage} />

            <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#4B5563]">
              No Users
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex gap-[10px]">
              {filterOptionsToRender.map((filterOption) => (
                <button
                  className={`px-[11.3px] py-[5px] rounded ${
                    (chosenFilter === FilterOption.ALL &&
                      filterOption === FilterOption.ALL) ||
                    (chosenFilter !== FilterOption.ALL &&
                      filterOption !== FilterOption.ALL &&
                      chosenFilter.includes(filterOption))
                      ? "border border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]"
                      : ""
                  }`}
                  onClick={() => handleChangeChosenFilter(filterOption)}
                  key={filterOption}
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
                  placeholder="Search all users"
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
            headClassName="bg-[#E5E7EB]"
            headings={[
              <div key={"customer_id"} className="px-5 py-[10px] select-none">
                Customer ID
              </div>,
              <div key="email" className="px-5 py-[10px] select-none">
                Email
              </div>,
              <div
                key="status"
                className="px-5 py-[10px] select-none flex gap-[2px] items-center cursor-pointer"
                onKeyDown={() => {}}
                onClick={() => {
                  if (sortOptions.sortBy !== SortProperty.STATUS) {
                    setSortOptions({
                      sortBy: SortProperty.STATUS,
                      sortType: SortType.DESC,
                    });

                    return;
                  }

                  if (sortOptions.sortType === SortType.ASC) {
                    setSortOptions({
                      sortBy: SortProperty.STATUS,
                      sortType: SortType.DESC,
                    });

                    return;
                  }

                  setSortOptions({
                    sortBy: SortProperty.STATUS,
                    sortType: SortType.ASC,
                  });
                }}
              >
                <div>Status</div>
                <div>
                  <img src={sortImage(SortProperty.STATUS)} />
                </div>
              </div>,
              <div
                key="last_update"
                className="px-5 py-[10px] select-none flex gap-[2px] items-center cursor-pointer"
                onKeyDown={() => {}}
                onClick={() => {
                  if (sortOptions.sortBy !== SortProperty.LAST_UPDATE) {
                    setSortOptions({
                      sortBy: SortProperty.LAST_UPDATE,
                      sortType: SortType.DESC,
                    });

                    return;
                  }

                  if (sortOptions.sortType === SortType.ASC) {
                    setSortOptions({
                      sortBy: SortProperty.LAST_UPDATE,
                      sortType: SortType.DESC,
                    });

                    return;
                  }

                  setSortOptions({
                    sortBy: SortProperty.LAST_UPDATE,
                    sortType: SortType.ASC,
                  });
                }}
              >
                <div>Last update</div>
                <div>
                  <img src={sortImage(SortProperty.LAST_UPDATE)} />
                </div>
              </div>,
            ]}
            rowsData={rows}
            rows={rows.map((row) => [
              <button key={row.customerId} className="text-[#6366F1]">
                {row.customerId}
              </button>,
              <div key={row.email}>{row.email}</div>,
              <div
                key={row.status}
                className={`px-[10px] py-[2px] rounded-[14px] w-fit ${
                  userStatusClassName[row.status]
                }`}
              >
                {row.status}
              </div>,
              <div key={row.lastUpdate}>
                {format(new Date(row.lastUpdate), "MM/dd/yyyy HH:mm")}
              </div>,
            ])}
          />
        </>
      )}

      {pagesCount > 1 && (
        <div className="flex justify-center items-center">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={pagesCount}
          />
        </div>
      )}
    </div>
  );
};

export default OverviewUserTable;
