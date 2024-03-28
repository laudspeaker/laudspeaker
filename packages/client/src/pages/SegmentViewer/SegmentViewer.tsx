import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { SegmentType } from "types/Segment";
import ManualSegmentTable from "./components/ManualSegmentTable/ManualSegmentTable";
import AutomaticSegmentViewer from "./components/AutomaticSegmentViewer/AutomaticSegmentViewer";
import { Query } from "reducers/flow-builder.reducer";

const SegmentViewer = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentType, setSegmentType] = useState(SegmentType.MANUAL);
  const [query, setQuery] = useState<Query>();
  const [customersCount, setCustomersCount] = useState(0);
  const [isLoadingSegment, setIsLoadingSegment] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
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
      setQuery(data.inclusionCriteria?.query);

      const { data: dataCustomersCount } = await ApiService.get<number>({
        url: `/segments/${id}/customers/count`,
      });
      setCustomersCount(dataCustomersCount);
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

  useEffect(() => {
    loadSegment();
    setCustomersToDeleteFromSegment([]);
  }, [isEditing]);

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
      options: {
        name,
        description,
        ...(segmentType === SegmentType.AUTOMATIC
          ? { inclusionCriteria: { query } }
          : {}),
      },
    });

    if (segmentType === SegmentType.MANUAL)
      await handleDeleteCustomersFromSegment();

    setIsEditing(false);
  };

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
            id="edit-segment-button"
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
              Eligible users: {customersCount} Users
            </div>
            {segmentType === SegmentType.MANUAL ? (
              <ManualSegmentTable
                id={id}
                isEditing={isEditing}
                isLoadingSegment={isLoadingSegment}
                customersToDeleteFromSegment={customersToDeleteFromSegment}
                setCustomersToDeleteFromSegment={
                  setCustomersToDeleteFromSegment
                }
              />
            ) : (
              query && (
                <AutomaticSegmentViewer
                  isEditing={isEditing}
                  query={query}
                  setQuery={setQuery}
                />
              )
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-2.5 px-5">
              <Button
                type={ButtonType.PRIMARY}
                onClick={handleSave}
                id="save-edit-segment-button"
              >
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
