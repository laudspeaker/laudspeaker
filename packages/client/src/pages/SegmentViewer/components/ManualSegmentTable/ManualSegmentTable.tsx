import { PeopleRowData } from "pages/PeopleTablev2/PeopleTablev2";
import React, { FC, useEffect, useState } from "react";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Table from "components/Tablev2";
import { KeyIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Pagination from "components/Pagination";
import MapValidationErrors from "pages/PeopleImport/Modals/MapValidationErrors";

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

interface ManualSegmentTableProps {
  id: string;
  isEditing: boolean;
  isLoadingSegment: boolean;
  customersToDeleteFromSegment: string[];
  setCustomersToDeleteFromSegment: (value: string[]) => void;
}

const ManualSegmentTable: FC<ManualSegmentTableProps> = ({
  id,
  isEditing,
  isLoadingSegment,
  customersToDeleteFromSegment,
  setCustomersToDeleteFromSegment,
}) => {
  const navigate = useNavigate();

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [rows, setRows] = useState<PeopleRowData[]>([]);
  const [pkKeyName, setPKKeyName] = useState<string>();
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.CREATED_AT,
    sortType: SortType.DESC,
  });

  const ITEMS_PER_PAGE = 10;

  const loadPeopleData = async () => {
    setIsPeopleLoading(true);
    try {
      const {
        data: { data, totalPages, pkName },
      } = await ApiService.get<{
        data: PeopleRowData[];
        totalPages: number;
        pkName?: string;
      }>({
        url: `/segments/${id}/customers?take=${ITEMS_PER_PAGE}&skip=${
          (currentPage - 1) * ITEMS_PER_PAGE
        }&orderBy=${sortOptions.sortBy}&orderType=${sortOptions.sortType}`,
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
      setIsPeopleLoading(false);
    }
  };

  const handleDeleteAllCustomers = async () => {
    try {
      await ApiService.delete({ url: `/segments/${id}/customers` });
      setIsDeleteAllOpen(false);
      await loadPeopleData();
    } catch (err) {
      toast.error("Failed to clear segment");
    }
  };

  useEffect(() => {
    if (isLoadingSegment) return;

    loadPeopleData();
  }, [id, currentPage, ITEMS_PER_PAGE, isLoadingSegment, sortOptions]);

  useEffect(() => {
    setSelectedCustomers([]);
  }, [isEditing]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOptions]);

  const handleChangeSelectedCustomers = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, rowId]);
    } else {
      selectedCustomers.splice(selectedCustomers.indexOf(rowId), 1);
      setSelectedCustomers([...selectedCustomers]);
    }
  };

  return (
    <>
      {isEditing ? (
        <div className="flex w-full justify-between items-center">
          <Button
            type={ButtonType.DANGEROUS}
            onClick={() => {
              setCustomersToDeleteFromSegment([...selectedCustomers]);
              setSelectedCustomers([]);
            }}
            disabled={selectedCustomers.length === 0}
            className="w-fit"
          >
            Delete
          </Button>
          <Button
            type={ButtonType.DANGEROUS}
            onClick={() => setIsDeleteAllOpen(true)}
            className="w-fit"
          >
            Delete all users from segment
          </Button>
        </div>
      ) : (
        <div>
          This segment includes users selected from the CSV file you upload.
        </div>
      )}

      <div>
        <Table
          className="w-full"
          headClassName="bg-[#F3F4F6] rounded"
          isLoading={isPeopleLoading}
          headings={[
            ...(isEditing
              ? [
                  <div className="px-5 py-2.5 select-none">
                    <input
                      type="checkbox"
                      checked={rows.every((row) =>
                        selectedCustomers.includes(row.id)
                      )}
                      onChange={(e) =>
                        setSelectedCustomers(
                          e.target.checked ? rows.map((row) => row.id) : []
                        )
                      }
                    />
                  </div>,
                ]
              : []),
            <div className="px-5 py-2.5 select-none">ID</div>,
            <div className="px-5 py-2.5 select-none">
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
            ...(isEditing ? [<></>] : []),
          ]}
          rowsData={rows}
          rows={rows
            .filter((row) => !customersToDeleteFromSegment.includes(row.id))
            .map((row) => [
              ...(isEditing
                ? [
                    <>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(row.id)}
                        onChange={(e) =>
                          handleChangeSelectedCustomers(
                            row.id,
                            e.target.checked
                          )
                        }
                      />
                    </>,
                  ]
                : []),
              <button
                className="text-[#6366F1]"
                onClick={() => navigate(`/person/${row.id}`)}
              >
                {row.id}
              </button>,
              <div>{pkKeyName ? row[pkKeyName] : row.email}</div>,
              <div>
                {row.createdAt &&
                  format(new Date(row.createdAt), "MM/dd/yyyy HH:mm")}
              </div>,
              ...(isEditing
                ? [
                    <>
                      <Button
                        type={ButtonType.LINK}
                        className="text-[#F43F5E] hover:text-[#F43F5E]"
                        onClick={() =>
                          setCustomersToDeleteFromSegment([
                            ...customersToDeleteFromSegment,
                            row.id,
                          ])
                        }
                      >
                        Delete
                      </Button>
                    </>,
                  ]
                : []),
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
      <MapValidationErrors
        isOpen={isDeleteAllOpen}
        title={"Delete all users from segment?"}
        desc={
          "Are you sure you want to delete all customers from segment?\nThis action performed instantly and can't be canceled"
        }
        cancelText={"Cancel"}
        confirmText={"Delete All"}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleDeleteAllCustomers}
      />
    </>
  );
};

export default ManualSegmentTable;
