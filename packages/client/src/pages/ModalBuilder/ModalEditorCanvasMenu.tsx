import ReactSlider from "react-slider";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import ModalMediaUploader from "./Elements/ModalMediaUploader";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import { BackgroundType, ModalState, SizeUnit } from "./types";

interface IModalEditorCanvasMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  currentMainMode: EditorMenuOptions;
}

const ModalEditorCanvasMenu = ({
  modalState,
  setModalState,
  currentMainMode,
}: IModalEditorCanvasMenuProps) => {
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
                min={modalState.width.unit === SizeUnit.PIXEL ? 100 : 1}
                max={modalState.width.unit === SizeUnit.PIXEL ? bodyWidth : 100}
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
                    className="rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border-2 border-[#6366F1]"
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
                className="!w-[120px]"
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
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="px-5 pb-[20px] pt-[10px] flex flex-col gap-[10px]">
        <div>Background:</div>
        <div className="flex select-none">
          <div
            className={`flex p-[5px_16px] justify-center items-center w-full rounded-sm cursor-pointer ${
              modalState.background.selected === BackgroundType.SOLID
                ? "bg-[#6366F1] text-white"
                : "border border-[#E5E7EB] hover:bg-white hover:bg-opacity-25"
            }`}
            onClick={() =>
              setModalState({
                ...modalState,
                background: {
                  ...modalState.background,
                  selected: BackgroundType.SOLID,
                },
              })
            }
          >
            Solid
          </div>
          <div
            className={`flex p-[5px_16px] justify-center items-center w-full cursor-pointer ${
              modalState.background.selected === BackgroundType.GRADIENT
                ? "bg-[#6366F1] text-white"
                : "border border-[#E5E7EB] hover:bg-white hover:bg-opacity-25"
            }`}
            onClick={() =>
              setModalState({
                ...modalState,
                background: {
                  ...modalState.background,
                  selected: BackgroundType.GRADIENT,
                },
              })
            }
          >
            Gradient
          </div>
          <div
            className={`flex p-[5px_16px] justify-center items-center w-full rounded-sm cursor-pointer ${
              modalState.background.selected === BackgroundType.IMAGE
                ? "bg-[#6366F1] text-white"
                : "border border-[#E5E7EB] hover:bg-white hover:bg-opacity-25"
            }`}
            onClick={() =>
              setModalState({
                ...modalState,
                background: {
                  ...modalState.background,
                  selected: BackgroundType.IMAGE,
                },
              })
            }
          >
            Image
          </div>
        </div>
        {modalState.background.selected === BackgroundType.SOLID && (
          <>
            <div className="flex items-center justify-between">
              <div>Color:</div>
              <div className="flex items-center gap-[10px]">
                <ModalBuilderColorPicker
                  className="!min-w-[122px]"
                  color={modalState.background[BackgroundType.SOLID].color}
                  onChange={(color) =>
                    setModalState({
                      ...modalState,
                      background: {
                        ...modalState.background,
                        [BackgroundType.SOLID]: {
                          ...modalState.background[BackgroundType.SOLID],
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
                <ModalBuilderNumberInput
                  id="opacity"
                  name="opacity"
                  unit={SizeUnit.PERCENTAGE}
                  value={
                    modalState.background[BackgroundType.SOLID].opacity * 100
                  }
                  min={0}
                  max={100}
                  onChange={(val) =>
                    setModalState({
                      ...modalState,
                      background: {
                        ...modalState.background,
                        [BackgroundType.SOLID]: {
                          ...modalState.background[BackgroundType.SOLID],
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
        {modalState.background.selected === BackgroundType.GRADIENT && (
          <>
            <div className="flex items-center justify-between">
              <div>Color 1:</div>
              <div className="flex items-center gap-[10px]">
                <ModalBuilderColorPicker
                  className="!min-w-[122px]"
                  color={modalState.background[BackgroundType.GRADIENT].color1}
                  onChange={(color) =>
                    setModalState({
                      ...modalState,
                      background: {
                        ...modalState.background,
                        [BackgroundType.GRADIENT]: {
                          ...modalState.background[BackgroundType.GRADIENT],
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
                <ModalBuilderColorPicker
                  className="!min-w-[122px]"
                  color={modalState.background[BackgroundType.GRADIENT].color2}
                  onChange={(color) =>
                    setModalState({
                      ...modalState,
                      background: {
                        ...modalState.background,
                        [BackgroundType.GRADIENT]: {
                          ...modalState.background[BackgroundType.GRADIENT],
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
                <ModalBuilderNumberInput
                  id="opacity"
                  name="opacity"
                  unit={SizeUnit.PERCENTAGE}
                  min={0}
                  max={100}
                  value={
                    modalState.background[BackgroundType.GRADIENT].opacity * 100
                  }
                  onChange={(val) =>
                    setModalState({
                      ...modalState,
                      background: {
                        ...modalState.background,
                        [BackgroundType.GRADIENT]: {
                          ...modalState.background[BackgroundType.GRADIENT],
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
        {modalState.background.selected === BackgroundType.IMAGE && (
          <>
            <div className="flex flex-col items-start gap-[6px] justify-center">
              <div>Select image:</div>
              <small className="w-full text-[#4B5563] text-[12px]">
                For a better visual appeal, images with a similar width to the
                canvas work best.
              </small>
              <ModalMediaUploader
                modalState={modalState}
                setModalState={setModalState}
                currentMainMode={currentMainMode}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalEditorCanvasMenu;
