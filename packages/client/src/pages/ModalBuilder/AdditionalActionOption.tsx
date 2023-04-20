import { GenericButton } from "components/Elements";
import EditIconSVG from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { AdditionalClickOptions, SubMenuOptions } from "./types";
import { useEffect, useState } from "react";
import { IAdditionalActionData } from "./ModalEditor";
import { AdditionalActionGeneralIcon } from "./Icons/ModalBuilderIcons";
import { AdditionalClickOptionsRecord } from "./ModalEditorAdditionalClicks";

interface IAdditionalActionOptionProps {
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
}

const AdditionalActionOption = ({
  onOptionPick,
  actionData,
  currentMainMode,
}: IAdditionalActionOptionProps) => {
  const [actionsMeta, setActionsMeta] = useState({
    action: {
      icon: <></>,
      name: "",
    },
  });

  useEffect(() => {
    if (!actionData[currentMainMode]) return;

    const actionArr = Object.values(actionData[currentMainMode]);
    const reducedList = actionArr.reduce(
      (prev, cur) => {
        return {
          count: !cur.hidden ? (prev.count += 1) : prev.count,
          enabled: !cur.hidden ? cur.action : prev.enabled,
        };
      },
      { count: 0, enabled: AdditionalClickOptions.NOACTION }
    );
    const action: { icon: JSX.Element; name: string } = actionsMeta.action;

    if (reducedList.count > 1) {
      action.icon = <AdditionalActionGeneralIcon />;
      action.name = reducedList.count + " actions";
    } else if (reducedList.count === 1) {
      action.icon = AdditionalClickOptionsRecord[reducedList.enabled].icon;
      action.name = AdditionalClickOptionsRecord[reducedList.enabled].name;
    } else {
      action.icon = <AdditionalActionGeneralIcon />;
      action.name = "Add action";
    }

    setActionsMeta({
      action,
    });
  }, [actionData, currentMainMode]);

  return (
    <div className="flex w-full justify-between items-center">
      <div className="w-full">Additional action:</div>
      <GenericButton
        customClasses={`relative w-full flex text-[12px] !border-[2px] !border-[#2f4a43] !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-[8px] !p-[6px] flex align-center whitespace-nowrap overflow-hidden ${
          false ? "!bg-[#19362e]" : "!bg-[#2f4a43]"
        }`}
        onClick={onOptionPick(SubMenuOptions.AdditionalClicks, true)}
      >
        <span className="min-w-[16px] max-w-[16px] block mr-[8px]">
          {actionsMeta.action.icon}
        </span>
        <span className="!pr-[30px] text-ellipsis w-full block text-left overflow-hidden">
          {actionsMeta.action.name}
        </span>
        <div className="absolute opacity-0 hover:!opacity-100 bg-opacity-40 bg-white top-0 left-0 w-full h-full !rounded-[8px] transition-all border-[2px] border-white">
          <EditIconSVG className="absolute w-[20px] right-[10px] top-1/2 -translate-y-1/2 !text-white shadow-2xl rounded-full" />
        </div>
      </GenericButton>
    </div>
  );
};

export default AdditionalActionOption;
