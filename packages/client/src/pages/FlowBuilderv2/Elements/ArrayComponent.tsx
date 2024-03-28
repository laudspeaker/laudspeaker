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
> = ({
  value,
  onChange,
  type,
  placeholder,
  dateFormat,
  dataTestId = "array-component",
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const arr = useMemo(() => value, [value]) as any[];

  return (
    <div
      className="w-full h-[32px] px-3 py-[5px] border border-[#E5E7EB] cursor-pointer"
      onClick={() => setIsModalOpen(true)}
      data-testid={dataTestId}
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
                dataTestId={`${dataTestId}-${i}`}
              />
              <button
                onClick={() => {
                  arr.splice(i, 1);
                  onChange([...arr]);
                }}
                data-testid={`${dataTestId}-${i}-button`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}

          <Button
            type={ButtonType.SECONDARY}
            onClick={() => onChange([...arr, ""])}
            disabled={arr.length >= MAX_ARR_LENGTH}
            data-testid={`${dataTestId}-add-button`}
          >
            Add item
          </Button>

          <Button
            type={ButtonType.PRIMARY}
            onClick={() => setIsModalOpen(false)}
            data-testid={`${dataTestId}-save-button`}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
};
