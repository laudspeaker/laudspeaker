import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { changeNodeData } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowBuilderInput from "../Elements/FlowBuilderInput";
import FlowBuilderModal from "../Elements/FlowBuilderModal";
import { MessageNodeData, NodeData } from "../Nodes/NodeData";

interface FlowBuilderMessageRenameModalProps {
  isOpen: boolean;
  selectedNode: Node<NodeData, string | undefined> | undefined;
  onClose: () => void;
}

enum MessageRenameErrors {
  CANT_BE_EMPTY,
  SHOULD_BE_UNIQUE,
}

const MessageRenameErrorsMapping = {
  [MessageRenameErrors.CANT_BE_EMPTY]: "Message name can't be empty",
  [MessageRenameErrors.SHOULD_BE_UNIQUE]:
    "Message name should be unique in scope of journey",
};

const FlowBuilderMessageRenameModal = ({
  selectedNode,
  isOpen,
  onClose,
}: FlowBuilderMessageRenameModalProps) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const [messageRename, setMessageRename] = useState("");
  const [showMessageRenameErrors, setShowMessageRenameErrors] = useState(false);

  useEffect(() => {
    setMessageRename((selectedNode?.data as MessageNodeData)?.customName || "");
    setShowMessageRenameErrors(false);
  }, [isOpen]);

  const errors: MessageRenameErrors[] = [];

  if (
    selectedNode &&
    (selectedNode?.data as MessageNodeData)?.customName !== messageRename
  ) {
    if (!messageRename) {
      errors.push(MessageRenameErrors.CANT_BE_EMPTY);
    }
    if (
      nodes
        .filter((node) => node.type === "message")
        .some(
          (node) =>
            !!(node.data as MessageNodeData)?.customName &&
            (node.data as MessageNodeData)?.customName?.trim() ===
              messageRename.trim()
        )
    ) {
      errors.push(MessageRenameErrors.SHOULD_BE_UNIQUE);
    }
  }

  if (!selectedNode) return <></>;

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto">
        <div className="font-medium text-base ">Rename</div>
        <div className="mt-[16px]">
          <FlowBuilderInput
            type="text"
            value={messageRename}
            onChange={(val) => setMessageRename(val)}
          />
        </div>
        {showMessageRenameErrors &&
          errors.map((err) => (
            <div
              key={err}
              className="w-full font-inter font-normal text-[12px] leading-5 text-[#E11D48]"
            >
              {MessageRenameErrorsMapping[err]}
            </div>
          ))}
        <div className="flex justify-end items-center mt-[24px] gap-2">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              if (errors.length) {
                setShowMessageRenameErrors(true);
                return;
              }
              dispatch(
                changeNodeData({
                  id: selectedNode.id,
                  data: {
                    ...selectedNode.data,
                    customName: messageRename,
                  } as MessageNodeData,
                })
              );
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

export { FlowBuilderMessageRenameModal };
