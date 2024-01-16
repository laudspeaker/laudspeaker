import { KeyIcon } from "@heroicons/react/20/solid";
import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Pagination from "components/Pagination";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { PeopleRowData } from "pages/PeopleTablev2/PeopleTablev2";
import SegmentEditor from "pages/SegmentCreation/SegmentEditor";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { SegmentType } from "types/Segment";

const SegmentViewer = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentType, setSegmentType] = useState(SegmentType.MANUAL);
  const [isLoadingSegment, setIsLoadingSegment] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [rows, setRows] = useState<PeopleRowData[]>([]);
  const [pkKeyName, setPKKeyName] = useState<string>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customersToDeleteFromSegment, setCustomersToDeleteFromSegment] =
    useState<string[]>([]);

  const loadSegment = async () => {
    if (!id) return;

    setIsLoadingSegment(true);

    try {
      const { data } = await ApiService.get({ url: "/segments/" + id });

      setSegmentType(data.type);
      setName(data.name);
      setDescription(data.description);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data.message || "Unexpected error loading segment"
        );
        navigate("/segment");
        return;
      }
    } finally {
      setIsLoadingSegment(false);
    }
  };

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
        }`,
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

  useEffect(() => {
    loadSegment();
    setSelectedCustomers([]);
    setCustomersToDeleteFromSegment([]);
  }, [isEditing]);

  useEffect(() => {
    if (isLoadingSegment) return;

    loadPeopleData();
  }, [id, currentPage, ITEMS_PER_PAGE, isLoadingSegment]);

  const handleChangeSelectedCustomers = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, rowId]);
    } else {
      selectedCustomers.splice(selectedCustomers.indexOf(rowId), 1);
      setSelectedCustomers([...selectedCustomers]);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDeleteCustomersFromSegment = async () => {
    if (customersToDeleteFromSegment.length === 0) return;

    await ApiService.post({
      url: `/segments/${id}/customers/delete-batch`,
      options: { customerIds: [...customersToDeleteFromSegment] },
    });

    setCustomersToDeleteFromSegment([]);
  };

  const handleSave = async () => {
    await ApiService.patch({
      url: `/segments/${id}`,
      options: { name, description },
    });
    await handleDeleteCustomersFromSegment();

    setIsEditing(false);
  };

  if (segmentType === SegmentType.AUTOMATIC) return <SegmentEditor />;

  return (
    <div
      className={`font-inter font-normal text-[14px] text-[#111827] leading-[22px] ${
        isLoadingSegment &&
        "pointer-events-none cursor-wait opacity-70 animate-pulse"
      } `}
    >
      <div className="w-full bg-white py-[34px] px-5 font-inter font-semibold text-[20px] leading-[28px] text-[#111827] border-[#E5E7EB] border-t flex items-center justify-between">
        <div>{isEditing ? "Edit segment" : name}</div>
        {!isEditing && (
          <Button
            type={ButtonType.SECONDARY}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="p-5">
        <div className="pt-5 py-10 bg-white w-full flex flex-col gap-5 rounded">
          {!isEditing && description && (
            <div className="flex flex-col gap-2.5 border-b-[1px] border-b-[#E5E7EB] px-5 pb-5">
              <div>Description</div>
              <div>{description}</div>
            </div>
          )}
          {isEditing && (
            <div className="px-5 pb-5 border-b-[1px] border-b-[#E5E7EB]">
              <div className="mt-[10px]">
                <div className="mb-[5px] text-sm text-[#111827] font-inter">
                  Segment name
                </div>
                <Input
                  value={name}
                  onChange={(value) => setName(value)}
                  placeholder={"Segment name"}
                  wrapperClassName="!max-w-full w-full"
                  className="w-full"
                />
              </div>
              <div className="mt-[10px]">
                <div className="mb-[5px] text-sm text-[#111827] font-inter">
                  Description (optional)
                </div>
                <textarea
                  value={description}
                  className="resize-none w-full border border-[#E5E7EB] rounded px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none"
                  placeholder="Segment description"
                  rows={3}
                  onChange={(ev) => setDescription(ev.target.value || "")}
                />
              </div>
            </div>
          )}
          <div
            className={`flex flex-col gap-2.5 px-5 ${
              isEditing ? "border-b-[1px] border-b-[#E5E7EB] py-5" : ""
            }`}
          >
            <div className="text-[16px] leading-[24px] font-semibold">
              Eligible users
            </div>
            {isEditing ? (
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
            ) : (
              <div>
                This segment includes users selected from the CSV file you
                upload.
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
                                e.target.checked
                                  ? rows.map((row) => row.id)
                                  : []
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
                  <div className="px-5 py-2.5 select-none flex gap-[2px] items-center cursor-pointer">
                    <div>Created</div>
                  </div>,
                  ...(isEditing ? [<></>] : []),
                ]}
                rows={rows
                  .filter(
                    (row) => !customersToDeleteFromSegment.includes(row.id)
                  )
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
          </div>

          {isEditing && (
            <div className="flex items-center gap-2.5 px-5">
              <Button type={ButtonType.PRIMARY} onClick={handleSave}>
                Save
              </Button>
              <Button type={ButtonType.SECONDARY} onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SegmentViewer;
