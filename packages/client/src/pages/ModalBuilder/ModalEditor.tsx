import React, { FC, ReactNode, useState } from "react";
import {
  BackgroundType,
  defaultGradientBackground,
  defaultImageBackground,
  defaultSolidBackground,
  GradientBackground,
  ModalPosition,
  ModalState,
  SizeUnit,
  SolidBackground,
} from "./ModalBuilder";
import LeftArrowSVG from "@heroicons/react/20/solid/ChevronLeftIcon";
import Draggable from "react-draggable";
import ModalEditorMainMenu, { EditorMenuOptions } from "./ModalEditorMainMenu";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import SizeUnitPicker from "./SizeUnitPicker";
import {
  ModalPositionBottomCenterIcon,
  ModalPositionBottomLeftIcon,
  ModalPositionBottomRightIcon,
  ModalPositionCenterIcon,
  ModalPositionTopCenterIcon,
  ModalPositionTopLeftIcon,
  ModalPositionTopRightIcon,
} from "./Icons/ModalBuilderIcons";
import ReactSlider from "react-slider";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";

interface ModalEditorProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

interface IMenuOption {
  name: string;
  description?: string;
  layout: React.ReactNode;
}

const ModalEditor: FC<ModalEditorProps> = ({ modalState, setModalState }) => {
  const [editorMode, setEditorMode] = useState<EditorMenuOptions>(
    EditorMenuOptions.MAIN
  );

  const handleEditorModeSet = (mode: EditorMenuOptions) => {
    return () => {
      if (mode === EditorMenuOptions.TITLE)
        setModalState({
          ...modalState,
          title: { ...modalState.title, hidden: false },
        });
      setEditorMode(mode);
    };
  };

  const modalPositions = [
    ModalPosition.TOP_LEFT,
    ModalPosition.TOP_CENTER,
    ModalPosition.TOP_RIGHT,
    ModalPosition.CENTER,
    ModalPosition.BOTTOM_LEFT,
    ModalPosition.BOTTOM_CENTER,
    ModalPosition.BOTTOM_RIGHT,
  ];

  const modalPositionIconMap: Record<ModalPosition, ReactNode> = {
    [ModalPosition.TOP_LEFT]: <ModalPositionTopLeftIcon />,
    [ModalPosition.TOP_CENTER]: <ModalPositionTopCenterIcon />,
    [ModalPosition.TOP_RIGHT]: <ModalPositionTopRightIcon />,
    [ModalPosition.CENTER]: <ModalPositionCenterIcon />,
    [ModalPosition.BOTTOM_LEFT]: <ModalPositionBottomLeftIcon />,
    [ModalPosition.BOTTOM_CENTER]: <ModalPositionBottomCenterIcon />,
    [ModalPosition.BOTTOM_RIGHT]: <ModalPositionBottomRightIcon />,
  };

  const bodyWidth = document.body.clientWidth;

  const menuOptions: { [key: string]: IMenuOption } = {
    [EditorMenuOptions.MAIN]: {
      name: "Menu",
      layout: <ModalEditorMainMenu onOptionPick={handleEditorModeSet} />,
    },
    [EditorMenuOptions.TITLE]: {
      name: "Title",
      description: "Sometimes this is all that a user will read; make it count",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="flex items-center justify-between">
            <div>Alignment:</div>
            <div className="flex items-center gap-[10px]">...</div>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between">
            <div>Styles:</div>
            <div className="flex items-center gap-[10px]">...</div>
          </div>
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
      ),
    },
    [EditorMenuOptions.BODY]: {
      name: "Body",
      description: "Keep it succinct; we recommend max 2-3 lines",
      layout: <span>Body</span>,
    },
    [EditorMenuOptions.CANVAS]: {
      name: "Canvas",
      description: "Configure Step background and size",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="flex items-center justify-between mb-[20px]">
            <div>Width:</div>
            <div>
              <div>
                <ReactSlider
                  className="h-[20px] flex items-center justify-center"
                  trackClassName="h-[5px] bg-[#22C55E]"
                  min={modalState.width.unit === SizeUnit.PIXEL ? 100 : 1}
                  max={
                    modalState.width.unit === SizeUnit.PIXEL ? bodyWidth : 100
                  }
                  value={modalState.width.value}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      width: { ...modalState.width, value },
                    })
                  }
                  renderThumb={(props) => (
                    <div
                      {...props}
                      className="rounded-[100%] w-[16px] h-[16px] cursor-grab bg-white"
                    />
                  )}
                />
              </div>
              <div className="flex items-center gap-[10px]">
                <ModalBuilderNumberInput
                  id="width"
                  name="width"
                  value={modalState.width.value}
                  unit={modalState.width.unit}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      width: { ...modalState.width, value },
                    })
                  }
                />
                <SizeUnitPicker
                  value={modalState.width.unit}
                  onChange={(unit) =>
                    setModalState({
                      ...modalState,
                      width: { ...modalState.width, unit },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Corner:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                id="corner"
                name="corner"
                value={modalState.borderRadius.value}
                unit={modalState.borderRadius.unit}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    borderRadius: { ...modalState.borderRadius, value },
                  })
                }
                className="!min-w-[122px]"
              />
            </div>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex flex-col gap-[10px]">
            <div>Background:</div>
            <div className="flex select-none">
              <div
                className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] rounded-l-md cursor-pointer ${
                  modalState.background.type === BackgroundType.SOLID
                    ? "bg-white text-[#2f4a43]"
                    : "hover:bg-white hover:bg-opacity-25"
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    background:
                      modalState.background.type === BackgroundType.SOLID
                        ? modalState.background
                        : defaultSolidBackground,
                  })
                }
              >
                Solid
              </div>
              <div
                className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] cursor-pointer ${
                  modalState.background.type === BackgroundType.GRADIENT
                    ? "bg-white text-[#2f4a43]"
                    : "hover:bg-white hover:bg-opacity-25"
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    background:
                      modalState.background.type === BackgroundType.GRADIENT
                        ? modalState.background
                        : defaultGradientBackground,
                  })
                }
              >
                Gradient
              </div>
              <div
                className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] rounded-r-md cursor-pointer ${
                  modalState.background.type === BackgroundType.IMAGE
                    ? "bg-white text-[#2f4a43]"
                    : "hover:bg-white hover:bg-opacity-25"
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    background:
                      modalState.background.type === BackgroundType.IMAGE
                        ? modalState.background
                        : defaultImageBackground,
                  })
                }
              >
                Image
              </div>
            </div>
            {modalState.background.type === BackgroundType.SOLID && (
              <>
                <div className="flex items-center justify-between">
                  <div>Color:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderColorPicker
                      className="!min-w-[122px]"
                      color={modalState.background.color}
                      onChange={(color) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as SolidBackground),
                            color,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Opacity:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderNumberInput
                      id="opacity"
                      name="opacity"
                      unit={SizeUnit.PERCENTAGE}
                      value={modalState.background.opacity * 100}
                      onChange={(val) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as SolidBackground),
                            opacity: val / 100,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
            {modalState.background.type === BackgroundType.GRADIENT && (
              <>
                <div className="flex items-center justify-between">
                  <div>Color 1:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderColorPicker
                      className="!min-w-[122px]"
                      color={modalState.background.color1}
                      onChange={(color) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as GradientBackground),
                            color1: color,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Color 2:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderColorPicker
                      className="!min-w-[122px]"
                      color={modalState.background.color2}
                      onChange={(color) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as GradientBackground),
                            color2: color,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Opacity:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderNumberInput
                      id="opacity"
                      name="opacity"
                      unit={SizeUnit.PERCENTAGE}
                      value={modalState.background.opacity * 100}
                      onChange={(val) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as SolidBackground),
                            opacity: val / 100,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
            {modalState.background.type === BackgroundType.IMAGE && (
              <>
                <div className="flex items-center justify-between">
                  <div>Image source:</div>
                  <div className="flex items-center gap-[10px]">
                    {modalState.background.imageSrc}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.POSITION]: {
      name: "Position",
      description: "We recommend anchoring to page where possible",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="mt-[20px]">
            <div>Position:</div>
            <ul className="flex items-center justify-between py-[20px]">
              {modalPositions.map((position) => (
                <li>
                  <div
                    className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer text-transparent hover:text-white ${
                      position === modalState.position
                        ? "border-white border-[2px] bg-white bg-opacity-25"
                        : ""
                    }`}
                    onClick={() => setModalState({ ...modalState, position })}
                  >
                    {modalPositionIconMap[position]}
                    <div className="absolute text-[12px] font-normal whitespace-nowrap top-[101%] left-[-50%]">
                      {position}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between mb-[10px]">
            <div>X axis offset:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                id="x-axis-offset"
                name="x-axis-offset"
                value={modalState.xOffset.value}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    xOffset: { ...modalState.xOffset, value },
                  })
                }
                unit={modalState.xOffset.unit}
              />
              <SizeUnitPicker
                value={modalState.xOffset.unit}
                onChange={(unit) =>
                  setModalState({
                    ...modalState,
                    xOffset: { ...modalState.xOffset, unit },
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Y axis offset:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                id="y-axis-offset"
                name="y-axis-offset"
                value={modalState.yOffset.value}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    yOffset: { ...modalState.yOffset, value },
                  })
                }
                unit={modalState.yOffset.unit}
              />
              <SizeUnitPicker
                value={modalState.yOffset.unit}
                onChange={(unit) =>
                  setModalState({
                    ...modalState,
                    yOffset: { ...modalState.yOffset, unit },
                  })
                }
              />
            </div>
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.MEDIA]: {
      name: "Media",
      description: "Use to engage, not to explain",
      layout: <span>Media</span>,
    },
    [EditorMenuOptions.DISMISS]: {
      name: "Dismiss",
      description: "Let users easily Exit or Snooze the Tour",
      layout: <span>Dismiss</span>,
    },
    [EditorMenuOptions.PRIMARY]: {
      name: "Primary button",
      description: "Configure design and behavior",
      layout: <span>Primary</span>,
    },
  };

  return (
    <Draggable
      axis="both"
      handle="#draggableHead"
      defaultPosition={{
        x: 40,
        y: 40,
      }}
    >
      <div className="fixed w-[360px] z-[999999999] h-[600px] rounded-xl shadow-lg bg-[#19362e]">
        <div className="w-full p-[4px] mb-[10px]">
          <div
            id="draggableHead"
            className="w-full cursor-move py-[20px] flex flex-col px-[20px] font-medium text-white justify-center bg-[#2f4a43] rounded-xl"
          >
            <div className="flex items-center text-[18px] mb-[4px]">
              {editorMode !== EditorMenuOptions.MAIN && (
                <LeftArrowSVG
                  className="min-w-[34px] max-w-[34px] text-left cursor-pointer pr-[6px]"
                  onClick={handleEditorModeSet(EditorMenuOptions.MAIN)}
                />
              )}
              <span>{menuOptions[editorMode].name}</span>
            </div>
            <small className="block min-w-full">
              {menuOptions[editorMode].description}
            </small>
          </div>
        </div>
        <div className="px-[24px] h-full overflow-y-scroll overflow-x-hidden">
          {menuOptions[editorMode].layout}
        </div>
        <div></div>
      </div>
    </Draggable>
  );
};

export default ModalEditor;
