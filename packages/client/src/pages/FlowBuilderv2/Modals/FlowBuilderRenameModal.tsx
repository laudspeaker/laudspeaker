import React, { FC, useState } from "react";
import { setFlowName } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
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
        <div className="font-medium text-base ">Rename</div>
        <div className="mt-[16px]">
          <FlowBuilderInput
            type="text"
            value={name}
            onChange={(val) => setName(val)}
          />
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-2">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              dispatch(setFlowName(name));
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowBuilderRenameModal;
