import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import { ModalState, textStyles, textStylesIcons } from "./ModalBuilder";
import { textAlignment, textAlignmentIcons } from "./ModalEditor";
import { SizeUnit } from "./types";

interface IModalEditorTitleMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

const ModalEditorTitleMenu = ({
  modalState,
  setModalState,
}: IModalEditorTitleMenuProps) => {
  return (
    <div className="text-white text-[14px] font-normal">
      <div className="flex items-center justify-between pb-[4px] pt-[20px]">
        <div>Alignment:</div>

        <ul className="flex items-center justify-between">
          {textAlignment.map((alignment) => (
            <li key={alignment}>
              <div
                className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer ${
                  alignment === modalState.title.alignment
                    ? "border-white border-[2px] bg-white bg-opacity-25"
                    : ""
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    title: { ...modalState.title, alignment },
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
            color={modalState.title.textColor}
            onChange={(color) =>
              setModalState({
                ...modalState,
                title: { ...modalState.title, textColor: color },
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
            color={modalState.title.linkColor}
            onChange={(color) =>
              setModalState({
                ...modalState,
                title: { ...modalState.title, linkColor: color },
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
            value={modalState.title.fontSize}
            onChange={(value) =>
              setModalState({
                ...modalState,
                title: {
                  ...modalState.title,
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

export default ModalEditorTitleMenu;
