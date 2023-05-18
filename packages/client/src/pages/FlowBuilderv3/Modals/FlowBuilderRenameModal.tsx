import React, { FC, useState } from "react";
import { setFlowName } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowBuilderButton from "../Elements/FlowBuilderButton";
import FlowBuilderInput from "../Elements/FlowBuilderInput";
import FlowBuilderModal from "../Elements/FlowBuilderModal";

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

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto">
        <div className="font-medium text-[16px] leading-[24px] ">Rename</div>
        <div className="mt-[16px]">
          <FlowBuilderInput
            type="text"
            value={name}
            onChange={(val) => setName(val)}
          />
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-[8px]">
          <FlowBuilderButton
            onClick={onClose}
            className="!rounded-[2px] !text-[#111827] !bg-white !border-[1px] !border-[#E5E7EB]"
          >
            Cancel
          </FlowBuilderButton>
          <FlowBuilderButton
            className="!rounded-[2px]"
            onClick={() => {
              dispatch(setFlowName(name));
              onClose();
            }}
          >
            Save
          </FlowBuilderButton>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowBuilderRenameModal;
