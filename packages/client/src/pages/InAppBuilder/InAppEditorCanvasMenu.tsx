import ReactSlider from "react-slider";
import InAppBuilderColorPicker from "./Elements/InAppBuilderColorPicker";
import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import InAppMediaUploader from "./Elements/InAppMediaUploader";
import { EditorMenuOptions } from "./InAppEditorMainMenu";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import { BackgroundType, InAppState, SizeUnit } from "./types";

interface IInAppEditorCanvasMenuProps {
  inAppState: InAppState;
  setInAppState: (inAppState: InAppState) => void;
  currentMainMode: EditorMenuOptions;
}

const InAppEditorCanvasMenu = ({
  inAppState,
  setInAppState,
  currentMainMode,
}: IInAppEditorCanvasMenuProps) => {
  const bodyWidth = document.body.clientWidth;

  return (
    <div className="w-full text-[14px] font-normal">
      <div className="p-5">
        <div className="flex items-start justify-between mb-[20px]">
          <div>Width:</div>
          <div>
            <div>
              <ReactSlider
                className="h-[20px] flex items-center justify-center mb-[8px]"
                trackClassName="h-[4px] bg-[#6366F1] rounded"
                min={inAppState.width.unit === SizeUnit.PIXEL ? 100 : 1}
                max={inAppState.width.unit === SizeUnit.PIXEL ? bodyWidth : 100}
                value={inAppState.width.value}
                onChange={(value) =>
                  setInAppState({
                    ...inAppState,
                    width: { ...inAppState.width, value },
                  })
                }
                renderThumb={(props) => (
                  <div
                    {...props}
                    className="rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border-2 border-[#6366F1]"
                  />
                )}
              />
            </div>
            <div className="flex items-center gap-[10px]">
              <InAppBuilderNumberInput
                id="width"
                name="width"
                value={inAppState.width.value}
                unit={inAppState.width.unit}
                onChange={(value) =>
                  setInAppState({
                    ...inAppState,
                    width: { ...inAppState.width, value },
                  })
                }
                className="!w-[120px]"
              />
              <SizeUnitPicker
                value={inAppState.width.unit}
                onChange={(unit) =>
                  setInAppState({
                    ...inAppState,
                    width: { ...inAppState.width, unit },
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Corner:</div>
          <div className="flex items-center gap-[10px]">
            <InAppBuilderNumberInput
              id="corner"
              name="corner"
              value={inAppState.borderRadius.value}
              unit={inAppState.borderRadius.unit}
              onChange={(value) =>
                setInAppState({
                  ...inAppState,
                  borderRadius: { ...inAppState.borderRadius, value },
                })
              }
              className="!min-w-[122px]"
            />
          </div>
        </div>
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="px-5 pb-[20px] pt-[10px] flex flex-col gap-[10px]">
        <div>Background:</div>
        <div className="flex select-none">
          <div
            className={`flex p-[5px_16px] justify-center items-center w-full rounded-sm cursor-pointer ${
              inAppState.background.selected === BackgroundType.SOLID
                ? "bg-[#6366F1] text-white"
                : "border border-[#E5E7EB] hover:bg-white hover:bg-opacity-25"
            }`}
            onClick={() =>
              setInAppState({
                ...inAppState,
                background: {
                  ...inAppState.background,
                  selected: BackgroundType.SOLID,
                },
              })
            }
          >
            Solid
          </div>
          <div
            className={`flex p-[5px_16px] justify-center items-center w-full cursor-pointer ${
              inAppState.background.selected === BackgroundType.GRADIENT
                ? "bg-[#6366F1] text-white"
                : "border border-[#E5E7EB] hover:bg-white hover:bg-opacity-25"
            }`}
            onClick={() =>
              setInAppState({
                ...inAppState,
                background: {
                  ...inAppState.background,
                  selected: BackgroundType.GRADIENT,
                },
              })
            }
          >
            Gradient
          </div>
          <div
            className={`flex p-[5px_16px] justify-center items-center w-full rounded-sm cursor-pointer ${
              inAppState.background.selected === BackgroundType.IMAGE
                ? "bg-[#6366F1] text-white"
                : "border border-[#E5E7EB] hover:bg-white hover:bg-opacity-25"
            }`}
            onClick={() =>
              setInAppState({
                ...inAppState,
                background: {
                  ...inAppState.background,
                  selected: BackgroundType.IMAGE,
                },
              })
            }
          >
            Image
          </div>
        </div>
        {inAppState.background.selected === BackgroundType.SOLID && (
          <>
            <div className="flex items-center justify-between">
              <div>Color:</div>
              <div className="flex items-center gap-[10px]">
                <InAppBuilderColorPicker
                  className="!min-w-[122px]"
                  color={inAppState.background[BackgroundType.SOLID].color}
                  onChange={(color) =>
                    setInAppState({
                      ...inAppState,
                      background: {
                        ...inAppState.background,
                        [BackgroundType.SOLID]: {
                          ...inAppState.background[BackgroundType.SOLID],
                          color,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>Opacity:</div>
              <div className="flex items-center gap-[10px]">
                <InAppBuilderNumberInput
                  id="opacity"
                  name="opacity"
                  unit={SizeUnit.PERCENTAGE}
                  value={
                    inAppState.background[BackgroundType.SOLID].opacity * 100
                  }
                  min={0}
                  max={100}
                  onChange={(val) =>
                    setInAppState({
                      ...inAppState,
                      background: {
                        ...inAppState.background,
                        [BackgroundType.SOLID]: {
                          ...inAppState.background[BackgroundType.SOLID],
                          opacity: val / 100,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </>
        )}
        {inAppState.background.selected === BackgroundType.GRADIENT && (
          <>
            <div className="flex items-center justify-between">
              <div>Color 1:</div>
              <div className="flex items-center gap-[10px]">
                <InAppBuilderColorPicker
                  className="!min-w-[122px]"
                  color={inAppState.background[BackgroundType.GRADIENT].color1}
                  onChange={(color) =>
                    setInAppState({
                      ...inAppState,
                      background: {
                        ...inAppState.background,
                        [BackgroundType.GRADIENT]: {
                          ...inAppState.background[BackgroundType.GRADIENT],
                          color1: color,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>Color 2:</div>
              <div className="flex items-center gap-[10px]">
                <InAppBuilderColorPicker
                  className="!min-w-[122px]"
                  color={inAppState.background[BackgroundType.GRADIENT].color2}
                  onChange={(color) =>
                    setInAppState({
                      ...inAppState,
                      background: {
                        ...inAppState.background,
                        [BackgroundType.GRADIENT]: {
                          ...inAppState.background[BackgroundType.GRADIENT],
                          color2: color,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>Opacity:</div>
              <div className="flex items-center gap-[10px]">
                <InAppBuilderNumberInput
                  id="opacity"
                  name="opacity"
                  unit={SizeUnit.PERCENTAGE}
                  min={0}
                  max={100}
                  value={
                    inAppState.background[BackgroundType.GRADIENT].opacity * 100
                  }
                  onChange={(val) =>
                    setInAppState({
                      ...inAppState,
                      background: {
                        ...inAppState.background,
                        [BackgroundType.GRADIENT]: {
                          ...inAppState.background[BackgroundType.GRADIENT],
                          opacity: val / 100,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </>
        )}
        {inAppState.background.selected === BackgroundType.IMAGE && (
          <>
            <div className="flex flex-col items-start gap-[6px] justify-center">
              <div>Select image:</div>
              <small className="w-full text-[#4B5563] text-[12px]">
                For a better visual appeal, images with a similar width to the
                canvas work best.
              </small>
              <InAppMediaUploader
                inAppState={inAppState}
                setInAppState={setInAppState}
                currentMainMode={currentMainMode}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InAppEditorCanvasMenu;
