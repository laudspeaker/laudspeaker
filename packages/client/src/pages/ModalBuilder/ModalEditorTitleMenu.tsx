import { useEffect } from "react";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import { ModalState, textStyles, textStylesIcons } from "./ModalBuilder";
import { textAlignment, textAlignmentIcons } from "./ModalEditor";
import { SizeUnit, StylesVariants } from "./types";

interface IModalEditorTitleMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  returnBack: () => void;
}

const ModalEditorTitleMenu = ({
  modalState,
  setModalState,
  returnBack,
}: IModalEditorTitleMenuProps) => {
  useEffect(() => {
    setModalState({
      ...modalState,
      title: { ...modalState.title, hidden: false },
    });
  }, []);

  const handleAddStyles = (style: StylesVariants) => {
    const element = document.getElementById(
      "modal-builder-title-textarea"
    ) as HTMLTextAreaElement;

    if (!element) return;
    const indexStart = element.selectionStart;
    const indexEnd = element.selectionEnd;

    let newContent: string = modalState.title.content;
    let line = 0;
    for (const char of newContent.slice(0, indexStart)) {
      if (char === "\n") line++;
    }

    switch (style) {
      case StylesVariants.BOLD:
        newContent =
          newContent.slice(0, indexStart) +
          "**" +
          newContent.slice(indexStart, indexEnd) +
          "**" +
          newContent.slice(indexEnd);
        break;
      case StylesVariants.H1:
        const lines = newContent.split("\n");
        lines[line] = "# " + lines[line];
        newContent = lines.join("\n");
        break;
      case StylesVariants.ITALIC:
        newContent =
          newContent.slice(0, indexStart) +
          "_" +
          newContent.slice(indexStart, indexEnd) +
          "_" +
          newContent.slice(indexEnd);
        break;
      case StylesVariants.LINK:
        newContent =
          newContent.slice(0, indexStart) +
          "[" +
          newContent.slice(indexStart, indexEnd) +
          "](link here)" +
          newContent.slice(indexEnd);
        break;
    }

    setModalState({
      ...modalState,
      title: {
        ...modalState.title,
        content: newContent,
      },
    });
  };

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
                    handleAddStyles(style);
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
      <RemoveComponentButton
        onClick={() => {
          setModalState({
            ...modalState,
            title: { ...modalState.title, hidden: true },
          });
          returnBack();
        }}
      >
        Remove title
      </RemoveComponentButton>
    </div>
  );
};

export default ModalEditorTitleMenu;
