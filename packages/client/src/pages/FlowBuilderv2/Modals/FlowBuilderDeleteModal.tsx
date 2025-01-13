import React, { FC } from "react";
import { toast } from "react-toastify";
import { Node } from "reactflow";
import { removeNode } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch } from "store/hooks";
import { NodeData } from "../Nodes/NodeData";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import { WarningExclamationIcon } from "../Icons";

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

  const ModalProps = {
    title: "Are you sure delete it?",
    description: "This action cannot be undone.",
    onClose: onClose,
    isOpen,
    closeButtonText: "No",
    confirmButtonText: "Yes",
    closeButtonAction: onClose,
    confirmButtonAction: () => {
      handleNodeDeletion();
    },
    Icon: WarningExclamationIcon,
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default FlowBuilderDeleteModal;
