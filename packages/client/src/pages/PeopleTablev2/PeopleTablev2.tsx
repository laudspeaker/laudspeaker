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
import { useDebounce } from "react-use";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";
import NamePersonModal from "./Modals/NamePersonModal";
import AutoComplete from "components/AutoCompletev2";

interface PeopleRowData {
  id: string;
  email?: string;
  createdAt: string;
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { data, totalPages },
      } = await ApiService.get<{
        data: { id: string; email?: string; createdAt: string }[];
        totalPages: number;
      }>({
        url: `/customers?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&searchKey=${searchKey}&searchValue=${searchValue}&orderBy=${
          sortOptions.sortBy
        }&orderType=${sortOptions.sortType}`,
      });

      setRows(
        data.map((person) => ({
          id: person.id,
          email: person.email,
          createdAt: person.createdAt,
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
      url: `/customers/possible-attributes?key=${q}&isArray=false`,
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
          <Button type={ButtonType.SECONDARY} disabled onClick={() => {}}>
            Import Customer
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => setIsNamePersonModalOpen(true)}
            id="create-customer-button"
          >
            Create customer
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
                <button onClick={() => setShowSearch(true)}>
                  <img src={searchIconImage} />
                </button>
              )}
            </div>

            <Table
              isLoading={isLoading}
              headings={[
                <div className="px-5 py-[10px] select-none">ID</div>,
                <div className="px-5 py-[10px] select-none">Email</div>,
                <div
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
              rows={rows.map((row) => [
                <button
                  className="text-[#6366F1]"
                  onClick={() => navigate(`/person/${row.id}`)}
                >
                  {row.id}
                </button>,
                <div>{row.email}</div>,
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
      />
    </div>
  );
};

export default PeopleTablev2;
