import React, { FC } from "react";
import { ModalState } from "./ModalBuilder";

interface ModalEditorProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

const ModalEditor: FC<ModalEditorProps> = () => {
  return <div>ModalEditor</div>;
};

export default ModalEditor;
