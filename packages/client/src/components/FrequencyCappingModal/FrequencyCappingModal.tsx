import { useEffect, useState } from "react";
import ApiService from "services/api.service";
import { Workflow } from "types/Workflow";
import { toast } from "react-toastify";
import Modal from "components/Elements/Modal";
import sortAscChevronsImage from "../../pages/TemplateTablev2/svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "../../pages/TemplateTablev2/svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "../../pages/TemplateTablev2/svg/sort-none-chevrons.svg";
import Table from "components/Tablev2";
import { format } from "date-fns";
import Pagination from "components/Pagination";
import { useNavigate } from "react-router-dom";

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

enum SortProperty {
  STATUS = "status",
  LAST_UPDATE = "latestSave",
}

interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
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

interface JourneyRowData {
  id: string;
  name: string;
  status: JourneyStatus;
  enrolledCount: number;
  latestChangerEmail?: string;
  lastUpdate: string;
}

export const FrequencyCappingModal: React.FC<{
  handleShowModal: () => void;
  showModal: boolean;
}> = ({ showModal, handleShowModal }) => {
  const [rows, setRows] = useState<JourneyRowData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.LAST_UPDATE,
    sortType: SortType.DESC,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pagesCount, setPagesCount] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);

    try {
      const {
        data: { data, totalPages },
      } = await ApiService.get<{ data: Workflow[]; totalPages: number }>({
        url: `/journeys?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&orderBy=${sortOptions.sortBy}&orderType=${sortOptions.sortType}`,
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
            enrolledCount: workflow.enrolledCustomers || 0,
            lastUpdate: workflow.latestSave,
            latestChangerEmail: workflow.latestChangerEmail,
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
  }, [currentPage, sortOptions]);

  return (
    <Modal
      onClose={handleShowModal}
      isOpen={showModal}
      closeButtonNeed={false}
      hasBottomActionButtons
      panelClass="rounded-none p-8 pb-6 !max-w-[800px] overflow-x-auto"
      onRetest={loadData}
    >
      <div className="font-inter flex flex-col gap-2 text-black">
        <h1 className="text-xl font-bold">Included journeys</h1>
        <div>
          <Table
            isLoading={isLoading}
            className="w-full text-[14px] leading-[22px]"
            trHeadingClassName="bg-[#F3F4F6]"
            headings={[
              <div key="name" className="px-5 py-[10px] select-none">
                Name
              </div>,
              <div key="status" className="px-5 py-[10px] select-none">
                Status
              </div>,
              <div
                key="enrolled customer"
                className="px-5 py-[10px] select-none"
              >
                Enrolled customer
              </div>,
              <div
                key="sort"
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
            ]}
            rowsData={rows}
            rows={rows.map((row) => [
              <button
                key={`${row.id}-name`}
                className="text-[#6366F1]"
                onClick={() => navigate("/flow/" + row.id)}
              >
                {row.name}
              </button>,
              <div
                key={`${row.id}-status`}
                className={`px-[10px] py-[2px] rounded-[14px] w-fit ${
                  journeyStatusClassName[row.status]
                }`}
              >
                {row.status}
              </div>,
              <div key={`${row.id}-enrolled customer`}>
                {row.status === JourneyStatus.DRAFT ? (
                  "-"
                ) : (
                  <>{row.enrolledCount} persons</>
                )}
              </div>,
              <div>{format(new Date(row.lastUpdate), "MM/dd/yyyy HH:mm")}</div>,
            ])}
          />
        </div>
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
    </Modal>
  );
};
