import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { useEffect, useState } from "react";
import {
  SortOptions,
  SortProperty,
  SortType,
  TemplateRowData,
} from "pages/TemplateTablev2/TemplateTablev2";
import ApiService from "services/api.service";
import Template from "types/Template";
import { toast } from "react-toastify";
import Table from "components/Tablev2";
import sortAscChevronsImage from "../TemplateTablev2/svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "../TemplateTablev2/svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "../TemplateTablev2/svg/sort-none-chevrons.svg";
import { format } from "date-fns";
import Pagination from "components/Pagination";
import { useDebounce } from "react-use";
import { MessageType } from "types/Workflow";
import { capitalize } from "lodash";
import ApiConfig from "constants/api";
import { requestCreationBody } from "pages/TemplateTablev2/Modals/NameTemplate";
import FlowBuilderModal from "./Elements/FlowBuilderModal";

interface TemplateInlineEditorProps {
  type: MessageType;
  onTemplateCreated: (id: string) => void;
}

const TemplateInlineEditor = ({
  type,
  onTemplateCreated,
}: TemplateInlineEditorProps) => {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TemplateRowData[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.LAST_UPDATE,
    sortType: SortType.DESC,
  });
  const [newName, setNewName] = useState("");
  const [isCreateFromScratch, setIsCreateFromScratch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const ITEMS_PER_PAGE = 5;

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
        }&type=${type}`,
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
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newName) {
      toast.error("Name can't be empty");
      return;
    }

    setIsCreating(true);
    try {
      const response = await ApiService.post({
        url: `${ApiConfig.createTemplate}`,
        options: {
          // @ts-ignore
          ...requestCreationBody(newName)[type],
        },
      });
      setIsCreateFromScratch(false);
      onTemplateCreated(response.data.id);
    } catch (error) {
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    setIsCreating(true);
    try {
      const response = await ApiService.post({
        url: `/templates/${id}/duplicate`,
      });
      onTemplateCreated(response.data.id);
    } catch (err) {
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, sortOptions]);

  useDebounce(
    () => {
      setCurrentPage(1);
      loadData();
    },
    300,
    [search]
  );

  const handleCancelScratchCreation = () => {
    setIsCreateFromScratch(false);
    setNewName("");
  };

  return (
    <div className="max-h-[calc(100vh-106px)] h-full flex p-5">
      <div className="w-full h-auto bg-white py-5 rounded flex flex-col">
        <div className="px-5">
          <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#111827] mb-[10px]">
            Start from scratch
          </div>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => setIsCreateFromScratch(true)}
            disabled={isCreating}
          >
            Create {capitalize(type)}
          </Button>
        </div>
        <hr className="border-[#E5E7EB] my-5" />
        <div className="px-5">
          <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#111827] mb-[10px]">
            Or, start from existing push
          </div>
          <span className="relative">
            <MagnifyingGlassIcon className="z-[1] w-[18px] h-[18px] text-[#4B5563] absolute left-[12px] top-[7px] pointer-events-none" />
            <Input
              value={search}
              onChange={setSearch}
              className="pl-[40px] py-[4px] pr-[12px]"
              placeholder="Search push"
            />
          </span>
          <Table
            isLoading={isLoading}
            className="w-full mt-[10px] [&>thead>tr>th]:!p-0"
            headings={[
              <div className="px-5 py-[10px] select-none w-full bg-[#F3F4F6] text-[14px] text-[#111827] font-inter font-semibold leading-[22px]">
                Name
              </div>,
              <div
                className="px-5 whitespace-nowrap py-[10px] select-none flex gap-[2px] items-center cursor-pointer bg-[#F3F4F6] text-[14px] text-[#111827] font-inter font-semibold leading-[22px]"
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
              <div className="px-5 py-[21px] select-none bg-[#F3F4F6] h-full" />,
            ]}
            rowsData={rows}
            rows={rows.map((row) => [
              <div className="w-[60vw]">
                <button
                  className="text-[#6366F1] text-left font-inter text-[14px] whitespace-nowrap leading-[22px]"
                  onClick={() => {}}
                  disabled={isCreating}
                >
                  {row.name}
                </button>
              </div>,
              <div className="text-[#111827] text-[14px] font-inter leading-[22px] whitespace-nowrap">
                {format(new Date(row.lastUpdate), "MM/dd/yyyy HH:mm")}
              </div>,
              <Button
                className="w-[74px]"
                type={ButtonType.PRIMARY}
                onClick={() => handleDuplicateTemplate(row.id.toString())}
                disabled={isCreating}
              >
                Create
              </Button>,
            ])}
          />
          {pagesCount > 1 && (
            <div className="flex mt-[10px] justify-center items-center">
              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={pagesCount}
              />
            </div>
          )}
        </div>
      </div>

      <FlowBuilderModal
        isOpen={isCreateFromScratch}
        onClose={handleCancelScratchCreation}
        className="max-w-[416px] w-full p-5"
      >
        <>
          <div className="text-[#111827] text-[16px] font-medium font-roboto leading-[24px] mb-[16px]">
            {capitalize(type)} name
          </div>
          <Input
            value={newName}
            onChange={setNewName}
            placeholder="Name"
            wrapperClassName="w-full mb-[24px]"
            className="w-full !rounded-sm !py-2 text-[16px] font-roboto"
          />
          <div className="flex justify-end gap-2">
            <Button
              type={ButtonType.SECONDARY}
              onClick={handleCancelScratchCreation}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type={ButtonType.PRIMARY}
              className="text-[#111827] border-[#E5E7EB]"
              onClick={createTemplate}
              disabled={isCreating}
            >
              Save
            </Button>
          </div>
        </>
      </FlowBuilderModal>
    </div>
  );
};
export default TemplateInlineEditor;
