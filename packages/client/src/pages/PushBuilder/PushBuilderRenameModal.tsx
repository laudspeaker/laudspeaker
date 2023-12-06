import Button, { ButtonType } from "components/Elements/Buttonv2";
import FlowBuilderInput from "pages/FlowBuilderv2/Elements/FlowBuilderInput";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import React, { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface PushBuilderRenameModalProps {
  isOpen: boolean;
  initName: string;
  onSave: (str: string) => void;
  onClose: () => void;
}

const PushBuilderRenameModal: FC<PushBuilderRenameModalProps> = ({
  isOpen,
  initName,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initName);

  useEffect(() => {
    setName(initName);
  }, [isOpen]);

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
              if (!name) {
                toast.error("Name can't be empty");
                return;
              }

              onSave(name);
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

export default PushBuilderRenameModal;
