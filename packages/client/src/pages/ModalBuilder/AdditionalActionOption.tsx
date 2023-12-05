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
      <div className="">Additional action:</div>
      <GenericButton
        customClasses={`relative w-[180px] !p-0 h-[32px] flex text-[12px] !border !shadow-none !border-[#E5E7EB] !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-sm flex align-center whitespace-nowrap overflow-hidden ${
          false ? "" : "!bg-white"
        }`}
        onClick={onOptionPick(SubMenuOptions.AdditionalClicks, true)}
      >
        <div className="px-[15px] py-[2px] text-[14px] leading-[22px] flex items-center">
          <span className="min-w-[16px] max-w-[16px] block mr-2 text-[#111827]">
            {actionsMeta.action.icon}
          </span>
          <span className="!pr-[30px] text-ellipsis w-full block text-left overflow-hidden text-[#111827]">
            {actionsMeta.action.name}
          </span>
        </div>
      </GenericButton>
    </div>
  );
};

export default AdditionalActionOption;
