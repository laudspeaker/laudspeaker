import { FC, useEffect, useMemo, useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";
import DynamicInput, { ValueChanger } from "./DynamicInput";
import Modal from "components/Elements/Modalv2";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import TrashIcon from "assets/icons/TrashIcon";
import { generateAttributeView } from "pages/Personv2/Personv2";

const MAX_ARR_LENGTH = 15;

export const ArrayComponent: FC<
  ValueChanger & { type: StatementValueType; dateFormat?: string }
> = ({ value, onChange, type, placeholder, dateFormat }) => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const arr = useMemo(() => value, [value]) as any[];

  return (
    <div
      className="w-full h-[32px] px-3 py-[5px] border border-[#E5E7EB] cursor-pointer"
      onClick={() => setIsModalOpen(true)}
    >
      <div>{generateAttributeView(arr, type, true, dateFormat)}</div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-2.5">
          {arr.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2.5">
              <DynamicInput
                value={item}
                type={type}
                onChange={(val) => {
                  arr[i] = val;
                  onChange([...arr]);
                }}
              />
              <button
                onClick={() => {
                  arr.splice(i, 1);
                  onChange([...arr]);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}

          <Button
            type={ButtonType.SECONDARY}
            onClick={() => onChange([...arr, ""])}
            disabled={arr.length >= MAX_ARR_LENGTH}
          >
            Add item
          </Button>

          <Button
            type={ButtonType.PRIMARY}
            onClick={() => setIsModalOpen(false)}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
};
