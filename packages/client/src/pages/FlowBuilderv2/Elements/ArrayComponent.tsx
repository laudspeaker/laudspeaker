import { FC, useEffect, useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";
import DynamicInput, { ValueChanger } from "./DynamicInput";
import Modal from "components/Elements/Modalv2";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import TrashIcon from "assets/icons/TrashIcon";

const MAX_ARR_LENGTH = 15;

export const ArrayComponent: FC<
  ValueChanger & { type: StatementValueType }
> = ({ value, onChange, type, placeholder }) => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [arr, setArr] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      setArr(JSON.parse(value));
    } catch (e) {
      setArr([]);
    }
  }, [value]);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    onChange(JSON.stringify(arr));
  }, [arr]);

  return (
    <div
      className="w-full h-[32px] px-3 py-[5px] border border-[#E5E7EB] cursor-pointer"
      onClick={() => setIsModalOpen(true)}
    >
      <div>{arr.join(", ")}</div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-2.5">
          {arr.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2.5">
              <DynamicInput
                value={item}
                type={type}
                onChange={(val) => {
                  arr[i] = val;
                  setArr([...arr]);
                }}
              />
              <button
                onClick={() => {
                  arr.splice(i, 1);
                  setArr([...arr]);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}

          <Button
            type={ButtonType.SECONDARY}
            onClick={() => setArr([...arr, ""])}
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
