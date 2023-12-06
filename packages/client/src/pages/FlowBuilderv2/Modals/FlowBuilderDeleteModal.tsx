import React, { FC } from "react";
import { toast } from "react-toastify";
import { Node } from "reactflow";
import { removeNode } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch } from "store/hooks";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import FlowBuilderModal from "../Elements/FlowBuilderModal";
import { NodeData } from "../Nodes/NodeData";

interface FlowBuilderDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: Node<NodeData>;
}

const FlowBuilderDeleteModal: FC<FlowBuilderDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedNode,
}) => {
  const dispatch = useAppDispatch();

  const handleNodeDeletion = async () => {
    try {
      if (selectedNode.data.stepId) {
        await ApiService.delete({
          url: `/steps/${selectedNode.data.stepId}`,
        });
      }
      dispatch(removeNode(selectedNode.id));
      onClose();
    } catch (error) {
      toast.error("Error while removing node, contact support if it repeats.");
    }
  };

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto">
        <div className="flex gap-4">
          <div>
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3180_25560)">
                <path
                  d="M11 0C4.92545 0 0 4.92545 0 11C0 17.0746 4.92545 22 11 22C17.0746 22 22 17.0746 22 11C22 4.92545 17.0746 0 11 0ZM11 20.1339C5.9567 20.1339 1.86607 16.0433 1.86607 11C1.86607 5.9567 5.9567 1.86607 11 1.86607C16.0433 1.86607 20.1339 5.9567 20.1339 11C20.1339 16.0433 16.0433 20.1339 11 20.1339Z"
                  fill="#EAB308"
                />
                <path
                  d="M9.82031 15.3214C9.82031 15.634 9.94448 15.9338 10.1655 16.1548C10.3865 16.3758 10.6863 16.5 10.9989 16.5C11.3115 16.5 11.6112 16.3758 11.8323 16.1548C12.0533 15.9338 12.1775 15.634 12.1775 15.3214C12.1775 15.0089 12.0533 14.7091 11.8323 14.4881C11.6112 14.267 11.3115 14.1429 10.9989 14.1429C10.6863 14.1429 10.3865 14.267 10.1655 14.4881C9.94448 14.7091 9.82031 15.0089 9.82031 15.3214ZM10.4096 12.5714H11.5882C11.6962 12.5714 11.7846 12.483 11.7846 12.375V5.69643C11.7846 5.58839 11.6962 5.5 11.5882 5.5H10.4096C10.3016 5.5 10.2132 5.58839 10.2132 5.69643V12.375C10.2132 12.483 10.3016 12.5714 10.4096 12.5714Z"
                  fill="#EAB308"
                />
              </g>
              <defs>
                <clipPath id="clip0_3180_25560">
                  <rect width="22" height="22" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-medium text-base">Are you sure delete it?</div>
            <div className="font-normal text-[14px] leading-[22px]">
              This action cannot be undone.
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-2">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            No
          </Button>
          <Button type={ButtonType.PRIMARY} onClick={handleNodeDeletion}>
            Yes
          </Button>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowBuilderDeleteModal;
