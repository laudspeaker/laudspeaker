import React, { FC, useEffect } from "react";
import ReactSlider from "react-slider";
import InAppBuilderColorPicker from "./Elements/InAppBuilderColorPicker";
import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import { InAppState, SizeUnit } from "./types";

interface InAppEditorShroudMenuProps {
  inAppState: InAppState;
  setInAppState: (
    state: InAppState | ((prevState: InAppState) => InAppState)
  ) => void;
  returnBack: () => void;
}

const InAppEditorShroudMenu: FC<InAppEditorShroudMenuProps> = ({
  inAppState,
  setInAppState,
  returnBack,
}) => {
  useEffect(() => {
    setInAppState({
      ...inAppState,
      shroud: { ...inAppState.shroud, hidden: false },
    });
  }, []);

  return (
    <div className="p-5 flex flex-col text-[14px] gap-[10px] font-normal">
      <div className="flex items-center justify-between mb-[10px]">
        <div>Color:</div>
        <div className="flex items-center pl-[5px] gap-[10px]">
          <InAppBuilderColorPicker
            className="!min-w-[150px]"
            color={inAppState.shroud.color}
            onChange={(color) =>
              setInAppState({
                ...inAppState,
                shroud: {
                  ...inAppState.shroud,
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
          <InAppBuilderNumberInput
            id="shroud-opacity"
            name="shroud-opacity"
            className="!min-w-[150px]"
            value={inAppState.shroud.opacity * 100}
            unit={SizeUnit.PERCENTAGE}
            onChange={(value) =>
              setInAppState(
                (prevState: InAppState): InAppState => ({
                  ...prevState,
                  shroud: { ...prevState.shroud, opacity: value / 100 },
                })
              )
            }
          ></InAppBuilderNumberInput>
        </div>
      </div>
      <div className="flex items-center justify-between gap-[10px]">
        <div className="w-full">Blur:</div>
        <div className="w-[180px]">
          <div className="relative">
            <ReactSlider
              className="h-[20px] flex items-center justify-center mb-[8px] w-[180px]"
              trackClassName="h-[4px] bg-[#6366F1] rounded"
              min={0}
              max={6}
              value={inAppState.shroud.blur}
              onChange={(blur) =>
                setInAppState({
                  ...inAppState,
                  shroud: { ...inAppState.shroud, blur },
                })
              }
              step={1}
              renderThumb={(props) => (
                <div
                  {...props}
                  className="rounded-[100%] w-[16px] h-[16px] cursor-grab bg-white border-2 border-[#6366F1]"
                />
              )}
            />
            <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-[7px]">
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
              <div className="rounded-[100%] bg-white w-[2px] h-[2px]" />
            </div>
          </div>
        </div>
      </div>

      <RemoveComponentButton
        onClick={() => {
          setInAppState({
            ...inAppState,
            shroud: {
              ...inAppState.shroud,
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

export default InAppEditorShroudMenu;
