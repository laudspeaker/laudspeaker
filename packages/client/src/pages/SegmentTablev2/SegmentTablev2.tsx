import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import searchIconImage from "./svg/search-icon.svg";
import threeDotsIconImage from "./svg/three-dots-icon.svg";
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
import emptyDataImage from "./svg/empty-data.svg";
import NameSegmentModal from "./Modals/NameSegmentModal";
import { Segment, SegmentType } from "types/Segment";
import { Link } from "react-router-dom";
import Select from "components/Elements/Selectv2";

interface SegmentRowData {
  id: string;
  name: string;
  type: string;
  lastUpdate: string;
}

enum SortProperty {
  UPDATED_AT = "updatedAt",
}

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
}

const SegmentTablev2 = () => {
  const navigate = useNavigate();

  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isNameSegmentModalOpen, setIsNameSegmentModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<SegmentRowData[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.UPDATED_AT,
    sortType: SortType.DESC,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const ITEMS_PER_PAGE = 5;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { data, totalPages },
      } = await ApiService.get<{
        data: Segment[];
        totalPages: number;
      }>({
        url: `/segments?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&search=${search}&orderBy=${sortOptions.sortBy}&orderType=${
          sortOptions.sortType
        }`,
      });

      setRows(
        data.map((segment) => ({
          id: segment.id,
          name: segment.name,
          type: segment.type,
          lastUpdate: new Date().toUTCString(),
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
    [search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOptions, search]);

  useEffect(() => {
    setSearch("");
  }, [showSearch]);

  const handleDuplicateSegment = async (id: string) => {
    await ApiService.post({ url: `/segments/${id}/duplicate` });
    await loadData();
  };

  const handleDeleteSegment = async (id: string) => {
    await ApiService.delete({ url: "/segments/" + id });
    await loadData();
  };

  return (
    <div className="p-5 flex flex-col gap-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex justify-between items-center">
        <div className="text-[20px] font-semibold leading-[28px]">Segments</div>

        <div>
          <Select
            options={[
              { key: SegmentType.MANUAL, title: "Upload CSV" },
              { key: SegmentType.AUTOMATIC, title: "Dynamic rules" },
            ]}
            value=""
            id="createSegmentSelect"
            onChange={(value) => {
              if (value === SegmentType.MANUAL)
                navigate("/segment/create/manual");

              if (value === SegmentType.AUTOMATIC)
                navigate("/segment/create/automatic");
            }}
            placeholder="Create Segment"
            customBTN={
              <Button type={ButtonType.PRIMARY} onClick={() => {}}>
                Create Segment
              </Button>
            }
            panelClassName="!max-w-[130px]"
          />
        </div>
      </div>
      <div className="p-5 bg-white rounded-lg flex flex-col gap-5">
        {rows.length === 0 && search === "" && isLoaded ? (
          <div className="w-full h-[300px] flex items-center justify-center select-none">
            <div className="flex flex-col items-center gap-5">
              <img src={emptyDataImage} />

              <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#4B5563]">
                Create a segment
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end items-center">
              {showSearch ? (
                <div className="flex gap-[10px] items-center">
                  <Input
                    value={search}
                    onChange={setSearch}
                    placeholder="Search all segments"
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
                <div className="px-5 py-[10px] select-none">Name</div>,
                <div className="px-5 py-[10px] select-none">Type</div>,
                <div
                  className="px-5 py-[10px] select-none flex gap-[2px] items-center cursor-pointer"
                  onClick={() => {
                    if (sortOptions.sortBy !== SortProperty.UPDATED_AT) {
                      setSortOptions({
                        sortBy: SortProperty.UPDATED_AT,
                        sortType: SortType.DESC,
                      });

                      return;
                    }

                    if (sortOptions.sortType === SortType.ASC) {
                      setSortOptions({
                        sortBy: SortProperty.UPDATED_AT,
                        sortType: SortType.DESC,
                      });

                      return;
                    }

                    setSortOptions({
                      sortBy: SortProperty.UPDATED_AT,
                      sortType: SortType.ASC,
                    });
                  }}
                >
                  <div>Last update</div>
                  <div>
                    <img
                      src={
                        sortOptions.sortBy === SortProperty.UPDATED_AT
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
                  className="text-[#6366F1]"
                  onClick={() => navigate(`/segment/${row.id}`)}
                >
                  {row.name}
                </button>,
                <div>{row.type}</div>,
                <div>
                  {format(new Date(row.lastUpdate), "MM/dd/yyyy HH:mm")}
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
                            className={`block w-full text-left py-[5px] px-[12px] ${
                              active ? "bg-[#F3F4F6]" : ""
                            }`}
                            onClick={() => handleDuplicateSegment(row.id)}
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
                            onClick={() => handleDeleteSegment(row.id)}
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

      <NameSegmentModal
        isOpen={isNameSegmentModalOpen}
        onClose={() => setIsNameSegmentModalOpen(false)}
      />
    </div>
  );
};

export default SegmentTablev2;
