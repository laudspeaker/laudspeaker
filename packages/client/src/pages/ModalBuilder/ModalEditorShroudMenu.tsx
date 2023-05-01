import React, { FC, useEffect } from "react";
import ReactSlider from "react-slider";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import { ModalState } from "./ModalBuilder";
import { SizeUnit } from "./types";

interface ModalEditorShroudMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  returnBack: () => void;
}

const ModalEditorShroudMenu: FC<ModalEditorShroudMenuProps> = ({
  modalState,
  setModalState,
  returnBack,
}) => {
  useEffect(() => {
    setModalState({
      ...modalState,
      shroud: { ...modalState.shroud, hidden: false },
    });
  }, []);

  return (
    <div className="flex flex-col text-[14px] font-normal">
      <div className="flex items-center justify-between mb-[10px]">
        <div>Color:</div>
        <div className="flex items-center pl-[5px] gap-[10px]">
          <ModalBuilderColorPicker
            className="!min-w-[150px]"
            color={modalState.shroud.color}
            onChange={(color) =>
              setModalState({
                ...modalState,
                shroud: {
                  ...modalState.shroud,
                  color,
                },
              })
            }
          />
        </div>
      </div>
      <div className="flex items-center justify-between mb-[10px]">
        <div>Opacity:</div>
        <div className="flex items-center pl-[5px] gap-[10px]">
          <ModalBuilderNumberInput
            id="shroud-opacity"
            name="shroud-opacity"
            className="!min-w-[150px]"
            value={modalState.shroud.opacity * 100}
            unit={SizeUnit.PERCENTAGE}
            onChange={(value) =>
              setModalState({
                ...modalState,
                shroud: { ...modalState.shroud, opacity: value / 100 },
              })
            }
          ></ModalBuilderNumberInput>
        </div>
      </div>
      <div className="flex items-center justify-between gap-[10px]">
        <div className="w-full">Blur:</div>
        <div className="w-[180px]">
          <div>
            <ReactSlider
              className="h-[20px] flex items-center justify-center mb-[8px] w-[180px]"
              trackClassName="h-[4px] bg-[#818CF8] rounded-[4px]"
              min={0}
              max={6}
              value={modalState.shroud.blur}
              onChange={(blur) =>
                setModalState({
                  ...modalState,
                  shroud: { ...modalState.shroud, blur },
                })
              }
              step={1}
              renderThumb={(props) => (
                <div
                  {...props}
                  className="rounded-[100%] w-[16px] h-[16px] cursor-grab bg-white border-[2px] border-[#818CF8]"
                />
              )}
            />
          </div>
        </div>
      </div>

      <RemoveComponentButton
        onClick={() => {
          setModalState({
            ...modalState,
            shroud: {
              ...modalState.shroud,
              hidden: true,
            },
          });
          returnBack();
        }}
      >
        Remove shroud
      </RemoveComponentButton>
    </div>
  );
};

export default ModalEditorShroudMenu;
