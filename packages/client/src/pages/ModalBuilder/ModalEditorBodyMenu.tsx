import { useEffect } from "react";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import { ModalState, textStyles, textStylesIcons } from "./ModalBuilder";
import { textAlignment, textAlignmentIcons } from "./ModalEditor";
import { SizeUnit, StylesVariants } from "./types";

interface IModalEditorBodyMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  returnBack: () => void;
}

const ModalEditorBodyMenu = ({
  modalState,
  setModalState,
  returnBack,
}: IModalEditorBodyMenuProps) => {
  useEffect(() => {
    setModalState({
      ...modalState,
      body: { ...modalState.body, hidden: false },
    });
  }, []);

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
                    const element = document.getElementById(
                      "modal-builder-body-textarea"
                    ) as HTMLTextAreaElement;

                    if (!element) return;
                    const indexStart = element.selectionStart;
                    const indexEnd = element.selectionEnd;

                    let newContent: string = modalState.body.content;
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
                      body: {
                        ...modalState.body,
                        content: newContent,
                      },
                    });
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
      <RemoveComponentButton
        onClick={() => {
          setModalState({
            ...modalState,
            body: {
              ...modalState.body,
              hidden: true,
            },
          });
          returnBack();
        }}
      >
        Remove body
      </RemoveComponentButton>
    </div>
  );
};

export default ModalEditorBodyMenu;
