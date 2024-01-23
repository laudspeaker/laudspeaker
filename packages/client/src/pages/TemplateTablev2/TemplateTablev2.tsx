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
import Template from "types/Template";
import { useNavigate } from "react-router-dom";
import Pagination from "components/Pagination";
import { toast } from "react-toastify";
import NameTemplateModal from "./Modals/NameTemplateModal";
import { useDebounce } from "react-use";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";

export interface TemplateRowData {
  id: number;
  name: string;
  type: string;
  lastUpdate: string;
}

export enum SortProperty {
  LAST_UPDATE = "updatedAt",
}

export enum SortType {
  ASC = "asc",
  DESC = "desc",
}

export interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
}

const TemplateTablev2 = () => {
  const navigate = useNavigate();

  const [isNameTemplateOpen, setIsNameTemplateOpen] = useState(false);

  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TemplateRowData[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.LAST_UPDATE,
    sortType: SortType.DESC,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { data, totalPages },
      } = await ApiService.get<{ data: Template[]; totalPages: number }>({
        url: `/templates?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&search=${search}&orderBy=${sortOptions.sortBy}&orderType=${
          sortOptions.sortType
        }&type=email&type=sms&type=webhook&type=push`,
      });

      setRows(
        data.map((template) => ({
          id: template.id,
          name: template.name,
          type: template.type,
          lastUpdate: template.updatedAt,
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

  const handleDuplicateTemplate = async (id: string) => {
    await ApiService.post({ url: `/templates/${id}/duplicate` });
    await loadData();
  };

  const handleDeleteTemplate = async (id: number) => {
    await ApiService.delete({ url: `/templates/${id}` });
    await loadData();
  };

  return (
    <div className="p-5 flex flex-col gap-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex justify-between items-center">
        <div className="text-[20px] font-semibold leading-[28px]">Template</div>

        <Button
          type={ButtonType.PRIMARY}
          onClick={() => setIsNameTemplateOpen(true)}
          id="create-template-button"
        >
          Create template
        </Button>
      </div>
      <div className="p-5 bg-white rounded-lg flex flex-col gap-5">
        {rows.length === 0 && search === "" && isLoaded ? (
          <div className="w-full h-[300px] flex items-center justify-center select-none">
            <div className="flex flex-col items-center gap-5">
              <img src={emptyDataImage} />

              <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#4B5563]">
                Create a template for your messages
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
                    placeholder="Search all templates"
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
                    <img
                      src={
                        sortOptions.sortBy === SortProperty.LAST_UPDATE
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
                  onClick={() => navigate(`/templates/${row.type}/${row.id}`)}
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
                    <Menu.Items className="absolute z-[120] right-0 origin-top-right w-[200px] h-[72px] py-[4px] rounded-sm bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`block w-full text-left py-[5px] px-[12px] ${
                              active ? "bg-[#F3F4F6]" : ""
                            }`}
                            onClick={() =>
                              handleDuplicateTemplate(row.id.toString())
                            }
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
                            onClick={() => handleDeleteTemplate(row.id)}
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

      <NameTemplateModal
        isOpen={isNameTemplateOpen}
        onClose={() => setIsNameTemplateOpen(false)}
      />
    </div>
  );
};

export default TemplateTablev2;
