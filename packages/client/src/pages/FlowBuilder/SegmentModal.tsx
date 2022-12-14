import { GenericButton, Input } from "components/Elements";
import Modal from "components/Elements/Modal";
import { MySegment } from "pages/Segment";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";
import AC from "react-autocomplete";
import { useDebounce } from "react-use";

export interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId?: string;
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
}) => {
  const [isSegmentEditModalOpen, setIsSegmentEditModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState({
    id: segmentId,
    inclusionCriteria: {},
    isFreezed: false,
  });
  const [segmentName, setSegmentName] = useState("");
  const [possibleSegments, setPossibleSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const refetchPossibleSegments = async () => {
    setIsLoading(true);
    const { data } = await ApiService.get({
      url: `/segments?searchText=${segmentName}`,
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
      const found = data.find((el: any) => el.id === segmentId);

      if (found) {
        setSelectedSegment(found);
        setSegmentName(found.name);
      }
      setIsFirstRender(false);
    })();
  }, []);

  useEffect(() => {
    if (segmentId) {
      // TODO: load segment data
    }
  }, [segmentId]);

  return (
    <Modal
      panelClass={`${
        isSegmentEditModalOpen &&
        "w-full !max-w-[90%] h-full max-h-full overflow-y-scroll"
      } `}
      isOpen={isOpen}
      onClose={onClose}
    >
      {isSegmentEditModalOpen ? (
        <MySegment
          onClose={() => setIsSegmentEditModalOpen(false)}
          workflowId={workflowId}
          segmentId={selectedSegment?.id}
          isCollapsible={true}
          onSubmit={() => {
            setIsSegmentEditModalOpen(false);
            refetchPossibleSegments();
          }}
        />
      ) : (
        <div className="w-full">
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
              <Input
                name={props.name || ""}
                value={props.value}
                onChange={props.onChange}
                inputRef={props.ref}
                className="mb-[10px]"
                aria-expanded={props["aria-expanded"]}
                disabled={isLoading}
                id="input_segment"
                {...props}
              />
            )}
            renderItem={(item, isHighlighted) => (
              <div
                key={item.id}
                className={`${
                  isHighlighted && !item.isFreezed ? "bg-cyan-100" : ""
                } ${
                  item.isFreezed && "bg-gray-200"
                } p-[2px] rounded-[6px] relative max-w-full break-all cursor-pointer`}
              >
                {item.name} {item.isFreezed && "(Freezed)"}
              </div>
            )}
            renderMenu={(items) => {
              if (!items.length) return <></>;

              return (
                <div className="max-h-[200px] overflow-y-scroll shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                  {items}
                </div>
              );
            }}
            onChange={(e) => {
              setSelectedSegment({
                id: segmentId,
                inclusionCriteria: {},
                isFreezed: false,
              });
              setSegmentName(e.target.value);
            }}
            onSelect={(e) => {
              const val = JSON.parse(e);

              setSegmentName(val.name);
              setSelectedSegment({
                ...val,
              });
            }}
          />
          <div className="flex justify-between">
            <GenericButton
              disabled={!selectedSegment.id || isLoading}
              onClick={() => {
                setSegmentId(selectedSegment.id);
                onClose();
              }}
            >
              Export
            </GenericButton>
            <GenericButton
              disabled={!selectedSegment.id || isLoading}
              onClick={() => {}}
            >
              Copy
            </GenericButton>

            <GenericButton
              disabled={
                !(selectedSegment.id && !selectedSegment.isFreezed) || isLoading
              }
              onClick={() => handleEditModalOpen(OpenModelType.Edit)}
            >
              Edit
            </GenericButton>
            <GenericButton
              onClick={() => handleEditModalOpen(OpenModelType.New)}
            >
              New
            </GenericButton>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SegmentModal;
