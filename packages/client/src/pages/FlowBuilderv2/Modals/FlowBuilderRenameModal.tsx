import React, { FC, useState } from "react";
import { setFlowName } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowBuilderInput from "../Elements/FlowBuilderInput";
import ConfirmationModal from "components/Elements/ConfirmationModal";

interface FlowBuilderRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlowBuilderRenameModal: FC<FlowBuilderRenameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const initialName = useAppSelector((state) => state.flowBuilder.flowName);
  const dispatch = useAppDispatch();

  const [name, setName] = useState(initialName);

  const RenameInput = () => {
    return (
      <>
        <div className="font-medium text-base ">Rename</div>
        <div className="mt-[16px]">
          <FlowBuilderInput
            type="text"
            value={name}
            onChange={(val) => setName(val)}
          />
        </div>
      </>
    );
  };

  const ModalProps = {
    onClose: onClose,
    isOpen,
    closeButtonText: "Cancel",
    confirmButtonText: "Save",
    closeButtonAction: onClose,
    confirmButtonAction: () => {
      dispatch(setFlowName(name));
      onClose();
    },
  };

  return (
    <ConfirmationModal {...ModalProps}>
      <RenameInput />
    </ConfirmationModal>
  );
};

export default FlowBuilderRenameModal;
