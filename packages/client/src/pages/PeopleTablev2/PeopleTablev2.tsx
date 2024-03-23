import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import searchIconImage from "./svg/search-icon.svg";
import threeDotsIconImage from "./svg/three-dots-icon.svg";
import emptyDataImage from "./svg/empty-data.svg";
import React, { Fragment, useEffect, useState } from "react";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { Menu, Transition } from "@headlessui/react";
import ApiService from "services/api.service";
import { useNavigate } from "react-router-dom";
import Pagination from "components/Pagination";
import { toast } from "react-toastify";
import KeyIcon from "@heroicons/react/24/solid/KeyIcon";
import { useDebounce } from "react-use";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";
import NamePersonModal from "./Modals/NamePersonModal";
import AutoComplete from "components/AutoCompletev2";

export interface PeopleRowData {
  id: string;
  email?: string;
  createdAt: string;
  [key: string]: any;
}

enum SortProperty {
  CREATED_AT = "createdAt",
}

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
}

const PeopleTablev2 = () => {
  const navigate = useNavigate();

  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isNamePersonModalOpen, setIsNamePersonModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [rows, setRows] = useState<PeopleRowData[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.CREATED_AT,
    sortType: SortType.DESC,
  });
  const [possibleKeys, setPossibleKeys] = useState<string[]>([]);
  const [keysQuery, setKeysQuery] = useState("");
  const [pkKeyName, setPKKeyName] = useState<string>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { data, totalPages, pkName },
      } = await ApiService.get<{
        data: PeopleRowData[];
        totalPages: number;
        pkName?: string;
      }>({
        url: `/customers?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&searchKey=${searchKey}&searchValue=${searchValue}&orderBy=${
          sortOptions.sortBy
        }&orderType=${sortOptions.sortType}`,
      });

      setPKKeyName(pkName);

      setRows(
        data.map((person) => ({
          id: person.id,
          email: person.email,
          createdAt: person.createdAt,
          ...(pkName ? { [pkName]: person[pkName] } : {}),
        }))
      );
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
  }, [currentPage, sortOptions]);

  useDebounce(
    () => {
      if (isFirstRender) {
        setIsFirstRender(false);
        return;
      }

      loadData();
    },
    500,
    [searchKey, searchValue]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOptions, searchKey, searchValue]);

  useEffect(() => {
    setSearchKey("");
    setSearchValue("");
  }, [showSearch]);

  const loadPossibleKeys = async (q: string) => {
    const { data } = await ApiService.get<
      {
        key: string;
      }[]
    >({
      url: `/customers/possible-attributes?key=${q}`,
    });

    setPossibleKeys(data.map((item) => item.key));
  };

  useDebounce(
    () => {
      loadPossibleKeys(keysQuery);
    },
    100,
    [keysQuery]
  );

  const handleDeletePerson = async (id: string) => {
    await ApiService.post({ url: "/customers/delete/" + id });
    await loadData();
  };

  return (
    <div className="p-5 flex flex-col gap-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex justify-between items-center">
        <div className="text-[20px] font-semibold leading-[28px]">User</div>

        <div className="flex items-center gap-[10px]">
          <Button
            type={ButtonType.SECONDARY}
            id="people-settings"
            onClick={() => {
              navigate("/people/setting");
            }}
          >
            Settings
          </Button>
          <Button
            type={ButtonType.SECONDARY}
            onClick={() => {
              navigate("/people/import");
            }}
            id="import-customer-button"
          >
            Import Customers via CSV
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => setIsNamePersonModalOpen(true)}
            id="create-customer-button"
            disabled={!pkKeyName}
          >
            Create New Customer
          </Button>
        </div>
      </div>
      <div className="p-5 bg-white rounded-lg flex flex-col gap-5">
        {rows.length === 0 &&
        searchKey === "" &&
        searchValue === "" &&
        isLoaded ? (
          <div className="w-full h-[300px] flex items-center justify-center select-none">
            <div className="flex flex-col items-center gap-5">
              <img src={emptyDataImage} />

              <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#4B5563]">
                Import or Create Customers to Get Started
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end items-center">
              {showSearch ? (
                <div className="flex gap-[10px] items-center">
                  <AutoComplete
                    value={searchKey}
                    onQueryChange={(q) => {
                      setSearchKey(q);
                      setKeysQuery(q);
                    }}
                    onSelect={(value) => {
                      setSearchKey(value);
                      setKeysQuery(value);
                    }}
                    includedItems={{
                      type: "getter",
                      items: possibleKeys.map((item) => item),
                    }}
                    retrieveLabel={(item) => item}
                    getKey={(value) => value}
                    placeholder="Customer key"
                  />

                  <Input
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Type the value to search"
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
                <button
                  onClick={() => setShowSearch(true)}
                  data-testid="user-search-button"
                >
                  <img src={searchIconImage} />
                </button>
              )}
            </div>

            <Table
              isLoading={isLoading}
              headings={[
                <div
                  className="px-5 py-[10px] select-none"
                  data-testid="id-header"
                >
                  ID
                </div>,
                <div
                  className="px-5 py-[10px] select-none"
                  data-testid="pk-header"
                >
                  {pkKeyName ? (
                    <div className="flex items-center gap-2">
                      <KeyIcon className="max-w-[12px] min-w-[12px] max-h-[12px] min-h-[12px]" />
                      {pkKeyName}
                    </div>
                  ) : (
                    "Email"
                  )}
                </div>,
                <div
                  data-testid="sort-header"
                  className="px-5 py-[10px] select-none flex gap-[2px] items-center cursor-pointer"
                  onClick={() => {
                    if (sortOptions.sortBy !== SortProperty.CREATED_AT) {
                      setSortOptions({
                        sortBy: SortProperty.CREATED_AT,
                        sortType: SortType.DESC,
                      });

                      return;
                    }

                    if (sortOptions.sortType === SortType.ASC) {
                      setSortOptions({
                        sortBy: SortProperty.CREATED_AT,
                        sortType: SortType.DESC,
                      });

                      return;
                    }

                    setSortOptions({
                      sortBy: SortProperty.CREATED_AT,
                      sortType: SortType.ASC,
                    });
                  }}
                >
                  <div>Created</div>
                  <div>
                    <img
                      src={
                        sortOptions.sortBy === SortProperty.CREATED_AT
                          ? sortOptions.sortType === SortType.ASC
                            ? sortAscChevronsImage
                            : sortDescChevronsImage
                          : sortNoneChevronsImage
                      }
                    />
                  </div>
                </div>,
                ,
                <div className="px-5 py-[10px] select-none"></div>,
              ]}
              rowsData={rows}
              rows={rows.map((row) => [
                <button
                  className="id-cell text-[#6366F1]"
                  onClick={() => navigate(`/person/${row.id}`)}
                >
                  {row.id}
                </button>,
                <div>{pkKeyName ? row[pkKeyName] : row.email}</div>,
                <div>
                  {format(new Date(row.createdAt), "MM/dd/yyyy HH:mm")}
                </div>,
                <Menu as="div" className="relative">
                  <Menu.Button>
                    <button className="px-[5px] py-[11px] rounded">
                      <img src={threeDotsIconImage} />
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
                    <Menu.Items className="absolute z-[120] right-0 origin-top-right w-[200px] py-[4px] rounded-sm bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`block w-full text-left py-[5px] px-[12px] text-[#F43F5E] ${
                              active ? "bg-[#F3F4F6]" : ""
                            }`}
                            onClick={() => handleDeletePerson(row.id)}
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

      <NamePersonModal
        isOpen={isNamePersonModalOpen}
        onClose={() => setIsNamePersonModalOpen(false)}
        pkKey={pkKeyName || "email"}
      />
    </div>
  );
};

export default PeopleTablev2;
