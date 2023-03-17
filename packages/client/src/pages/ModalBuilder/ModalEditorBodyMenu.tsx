import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import {
  ModalState,
  textStyles,
  textStylesIcons,
} from "./ModalBuilder";
import { textAlignment, textAlignmentIcons } from "./ModalEditor";
import { SizeUnit } from "./types";

interface IModalEditorBodyMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

const ModalEditorBodyMenu = ({
  modalState,
  setModalState,
}: IModalEditorBodyMenuProps) => {
  return (
    <div className="text-white text-[14px] font-normal">
      <div className="flex items-center justify-between pb-[4px] pt-[20px]">
        <div>Alignment:</div>

        <ul className="flex items-center justify-between">
          {textAlignment.map((alignment) => (
            <li key={alignment}>
              <div
                className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer ${
                  alignment === modalState.body.alignment
                    ? "border-white border-[2px] bg-white bg-opacity-25"
                    : ""
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    body: { ...modalState.body, alignment },
                  })
                }
              >
                {textAlignmentIcons[alignment]}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
      <div className="flex items-center justify-between">
        <div>Styles:</div>
        <div className="flex items-center gap-[10px]">
          <ul className="flex items-center justify-between">
            {textStyles.map((style) => (
              <li key={style}>
                <div
                  className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer`}
                  onClick={() => {
                    // TODO: add format to layout
                  }}
                >
                  {textStylesIcons[style]}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <small className="w-full mt-[10px] text-[#BAC3C0]">
        Select text before applying
      </small>
      <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
      <div className="flex items-center justify-between mb-[10px]">
        <div>Text:</div>
        <div className="flex items-center gap-[10px]">
          <ModalBuilderColorPicker
            className="min-w-[155px]"
            color={modalState.body.textColor}
            onChange={(color) =>
              setModalState({
                ...modalState,
                body: { ...modalState.body, textColor: color },
              })
            }
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Link:</div>
        <div className="flex items-center gap-[10px]">
          <ModalBuilderColorPicker
            className="min-w-[155px]"
            color={modalState.body.linkColor}
            onChange={(color) =>
              setModalState({
                ...modalState,
                body: { ...modalState.body, linkColor: color },
              })
            }
          />
        </div>
      </div>
      <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
      <div className="flex items-center justify-between">
        <div>Font size:</div>
        <div className="flex items-center gap-[10px]">
          <ModalBuilderNumberInput
            className="min-w-[155px]"
            id="fontSize"
            name="fontSize"
            unit={SizeUnit.PIXEL}
            value={modalState.body.fontSize}
            onChange={(value) =>
              setModalState({
                ...modalState,
                body: {
                  ...modalState.body,
                  fontSize: value,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ModalEditorBodyMenu;
