import { GenericButton, Input } from "components/Elements";
import Modal from "components/Elements/Modal";
import { MySegment } from "pages/Segment";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";
import AC from "react-autocomplete";
import { useDebounce } from "react-use";
import { duplicateSegment, getSegment } from "pages/Segment/SegmentHelpers";
import { toast } from "react-toastify";
import Chip from "components/Elements/Chip";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Tooltip from "components/Elements/Tooltip";
import { Segment } from "types/Segment";
import SideModal from "components/Elements/SideModal";

export enum SegmentModalMode {
  EDIT = "edit",
  NEW = "new",
}

export interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId?: string;
  mode: SegmentModalMode;
  setMode: React.Dispatch<React.SetStateAction<SegmentModalMode>>;
  setSegmentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  workflowId: string;
  onAttach?: (id: string) => void;
}

enum OpenModelType {
  New,
  Edit,
}

const SegmentModal: FC<SegmentModalProps> = ({
  isOpen,
  onClose,
  segmentId,
  setSegmentId,
  workflowId,
  setMode,
  mode,
}) => {
  const [isSegmentEditModalOpen, setIsSegmentEditModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState({
    id: segmentId,
    inclusionCriteria: {},
    isFreezed: false,
    name: "",
  });
  const [newSegmentName, setNewSegmentName] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [possibleSegments, setPossibleSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const updateSegmentData = async () => {
    setIsLoading(true);
    try {
      if (segmentId) {
        const { data } = await getSegment(segmentId);
        setSegmentName(data.name || "");
        setSelectedSegment({
          id: data.id || segmentId,
          inclusionCriteria: data.inclusionCriteria || {},
          isFreezed: !!data.isFreezed,
          name: data.name,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateSegmentData();
  }, [segmentId]);

  const refetchPossibleSegments = async () => {
    setIsLoading(true);
    const { data }: { data: Segment[] } = await ApiService.get({
      url: `/segments?searchText=${
        segmentName === selectedSegment.name ? "" : segmentName
      }`,
    });
    setIsLoading(false);
    setPossibleSegments(data || []);
    return data;
  };

  const handleEditModalOpen = (type: OpenModelType) => {
    if (type === OpenModelType.New) {
      setSelectedSegment({
        id: undefined,
        inclusionCriteria: {},
        isFreezed: false,
        name: "",
      });
    }

    setIsSegmentEditModalOpen(true);
  };

  useDebounce(
    () => {
      if (isFirstRender) return;
      refetchPossibleSegments();
    },
    500,
    [segmentName]
  );

  useEffect(() => {
    (async () => {
      const data = await refetchPossibleSegments();
      const found = data.find((el) => el.id === segmentId);

      if (found) {
        setSelectedSegment(found);
        setSegmentName(found.name);
      }
      setIsFirstRender(false);
    })();
  }, []);

  return (
    <SideModal
      panelClass={`${
        isSegmentEditModalOpen
          ? "w-[full] h-full max-h-full overflow-y-scroll z-[99999]"
          : ""
      } `}
      isOpen={isOpen}
      onClose={onClose}
    >
      {isSegmentEditModalOpen ? (
        <MySegment
          onClose={() => setIsSegmentEditModalOpen(false)}
          workflowId={workflowId}
          defaultTitle={newSegmentName}
          segmentId={selectedSegment?.id}
          isCollapsible={true}
          onSubmit={(id) => {
            setIsSegmentEditModalOpen(false);
            refetchPossibleSegments();
            if (id) {
              setSegmentId(id);
              updateSegmentData();
            }
          }}
        />
      ) : (
        <div className="w-full">
          {mode === SegmentModalMode.NEW && (
            <Input
              name="newSegmentName"
              id="segmentName"
              value={newSegmentName}
              className="mb-[10px]"
              onChange={(e) => {
                setNewSegmentName(e.target.value);
              }}
              placeholder="Customer Segment Name"
            />
          )}
          {mode === SegmentModalMode.EDIT && (
            <AC
              value={segmentName}
              getItemValue={(item) => JSON.stringify(item)}
              items={possibleSegments}
              autoHighlight={false}
              wrapperStyle={{
                width: "100%",
                position: "relative",
              }}
              renderInput={(props) => (
                <div className="w-full relative">
                  <Input
                    name={props.name || ""}
                    value={props.value}
                    onChange={props.onChange}
                    inputRef={props.ref}
                    autoFocus
                    className="mb-[10px] z-[10] relative bg-transparent"
                    aria-expanded={props["aria-expanded"]}
                    disabled={isLoading}
                    {...props}
                    placeholder="Customer Segment Name"
                    id="segmentName"
                  />
                  <ChevronUpDownIcon className="absolute w-[20px] top-[50%] -translate-y-1/2 right-[8px] text-gray-600" />
                </div>
              )}
              renderItem={(item, isHighlighted) => (
                <div
                  key={item.id}
                  className={`${
                    isHighlighted && !item.isFreezed ? "bg-cyan-100" : ""
                  } ${
                    item.isFreezed && "bg-gray-200"
                  } p-[2px] rounded-[6px] relative max-w-full break-all cursor-pointer flex justify-between`}
                >
                  {item.name}

                  <Chip
                    label={item.isFreezed ? "In use" : "Editable"}
                    wrapperClass={`${
                      item.isFreezed ? "!bg-yellow-500" : ""
                    } w-[70px]`}
                  />
                </div>
              )}
              renderMenu={(items) => {
                return (
                  <div className="max-h-[200px] overflow-y-scroll shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                    <div
                      className="p-[2px] rounded-[6px] relative max-w-full break-all cursor-pointer flex justify-between hover:bg-cyan-100"
                      onClick={() => setMode(SegmentModalMode.NEW)}
                    >
                      Create new
                    </div>
                    {items}
                  </div>
                );
              }}
              onChange={(e) => {
                setSelectedSegment({
                  id: segmentId,
                  inclusionCriteria: {},
                  isFreezed: false,
                  name: "",
                });
                setSegmentName(e.target.value);
              }}
              onSelect={(e) => {
                const val = JSON.parse(e);
                setSegmentId(val.id);
              }}
            />
          )}
          <div className="flex justify-between gap-[10px]">
            {mode === SegmentModalMode.EDIT && (
              <>
                <GenericButton
                  disabled={!selectedSegment.id || isLoading}
                  onClick={async () => {
                    if (!selectedSegment.id) {
                      return;
                    }
                    try {
                      const { data } = await duplicateSegment(
                        selectedSegment.id
                      );
                      if (data.id) setSelectedSegment(data);
                      handleEditModalOpen(OpenModelType.Edit);
                    } catch (e) {
                      console.error(e);
                      toast.error("Unexpected error");
                    }
                  }}
                >
                  Copy
                </GenericButton>
                <GenericButton
                  disabled={
                    !(selectedSegment.id && !selectedSegment.isFreezed) ||
                    isLoading
                  }
                  onClick={() => handleEditModalOpen(OpenModelType.Edit)}
                >
                  Edit
                </GenericButton>
              </>
            )}
            {mode === SegmentModalMode.NEW && (
              <Tooltip
                content={
                  !newSegmentName.trim() ? "Name of segment required" : ""
                }
                placement="left"
                className="!z-[2000000000]"
              >
                <GenericButton
                  id="submitSegmentCreate"
                  disabled={!newSegmentName.trim()}
                  onClick={() => handleEditModalOpen(OpenModelType.New)}
                >
                  Create
                </GenericButton>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </SideModal>
  );
};

export default SegmentModal;
