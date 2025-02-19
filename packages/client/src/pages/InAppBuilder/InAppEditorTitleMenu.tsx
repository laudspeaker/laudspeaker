import { useEffect } from "react";
import InAppBuilderColorPicker from "./Elements/InAppBuilderColorPicker";
import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import InAppBuilderPersonalizationButton from "./Elements/InAppBuilderPersonalizationButton";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import { textStyles, textStylesIcons } from "./InAppBuilder";
import { textAlignment, textAlignmentIcons } from "./InAppEditor";
import { EditorMenuOptions } from "./InAppEditorMainMenu";
import { InAppState, SizeUnit, StylesVariants, SubMenuOptions } from "./types";

interface IInAppEditorTitleMenuProps {
  inAppState: InAppState;
  setInAppState: React.Dispatch<React.SetStateAction<InAppState>>;
  returnBack: () => void;
  handleEditorModeSet: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
}

const InAppEditorTitleMenu = ({
  inAppState,
  setInAppState,
  returnBack,
  handleEditorModeSet,
}: IInAppEditorTitleMenuProps) => {
  useEffect(() => {
    setInAppState({
      ...inAppState,
      title: { ...inAppState.title, hidden: false },
    });
  }, []);

  const handleAddStyles = (style: StylesVariants) => {
    const element = document.getElementById(
      "inApp-builder-title-textarea"
    ) as HTMLTextAreaElement;

    if (!element) return;
    const indexStart = element.selectionStart;
    const indexEnd = element.selectionEnd;

    let newContent: string = inAppState.title.content;
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

    setInAppState(
      (prevState: InAppState): InAppState => ({
        ...prevState,
        title: {
          ...prevState.title,
          content: newContent,
        },
      })
    );
  };

  return (
    <div className="text-[14px] font-normal">
      <div className="p-5">
        <div className="flex items-center justify-between pb-[4px]">
          <div>Alignment:</div>

          <ul className="flex items-center justify-between w-[180px]">
            {textAlignment.map((alignment) => (
              <li key={alignment}>
                <div
                  className={`flex justify-center items-center relative w-[32px] h-[32px] hover:border hover:border-[#818CF8] rounded-md cursor-pointer ${
                    alignment === inAppState.title.alignment
                      ? "bg-[#C7D2FE]"
                      : ""
                  }`}
                  onClick={() =>
                    setInAppState((prevState) => ({
                      ...prevState,
                      title: { ...prevState.title, alignment },
                    }))
                  }
                >
                  {textAlignmentIcons[alignment]}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>Styles:</div>
          <div className="flex items-center gap-[10px]">
            <ul className="flex items-center justify-between w-[180px]">
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
        <small className="w-full mt-[10px] text-[#4B5563] text-[12px]">
          Select text before applying
        </small>
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="p-5">
        <div className="flex items-center justify-between mb-[10px]">
          <div>Text:</div>
          <div className="flex items-center gap-[10px]">
            <InAppBuilderColorPicker
              className="min-w-[155px]"
              color={inAppState.title.textColor}
              onChange={(color) =>
                setInAppState((prevState) => ({
                  ...prevState,
                  title: { ...prevState.title, textColor: color },
                }))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Link:</div>
          <div className="flex items-center gap-[10px]">
            <InAppBuilderColorPicker
              className="min-w-[155px]"
              color={inAppState.title.linkColor}
              onChange={(color) =>
                setInAppState((prevState) => ({
                  ...prevState,
                  title: { ...prevState.title, linkColor: color },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="p-5 flex items-center justify-between">
        <div>Font size:</div>
        <div className="flex items-center gap-[10px]">
          <InAppBuilderNumberInput
            className="min-w-[155px]"
            id="fontSize"
            name="fontSize"
            unit={SizeUnit.PIXEL}
            value={inAppState.title.fontSize}
            onChange={(value) =>
              setInAppState((prevState) => ({
                ...prevState,
                title: {
                  ...prevState.title,
                  fontSize: value,
                },
              }))
            }
          />
        </div>
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>Personalization:</div>
          <div className="flex items-center gap-[10px]">
            <InAppBuilderPersonalizationButton
              onClick={handleEditorModeSet(
                SubMenuOptions.Personalization,
                true
              )}
            />
          </div>
        </div>
        <RemoveComponentButton
          onClick={() => {
            setInAppState((prevState) => ({
              ...prevState,
              title: { ...prevState.title, hidden: true },
            }));
            returnBack();
          }}
        >
          Remove title
        </RemoveComponentButton>
      </div>
    </div>
  );
};

export default InAppEditorTitleMenu;
