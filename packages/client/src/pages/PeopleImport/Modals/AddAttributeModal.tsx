import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import { useState } from "react";
import { toast } from "react-toastify";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";

interface AddAttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddAttributeModal = ({
  isOpen,
  onClose,
  onAdded,
}: AddAttributeModalProps) => {
  const [newName, setNewName] = useState("");
  const [type, setType] = useState<StatementValueType>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    if (!type || !newName || isLoading) return;

    setIsLoading(true);
    try {
      await ApiService.post({
        url: `/customers/attributes/create`,
        options: {
          name: newName.trim(),
          type,
        },
      });
      onAdded();
      onClose();
    } catch (error) {
      toast.error("Apply another type or name.");
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return;

    onClose();
  };

  return (
    <>
      <FlowBuilderModal
        isOpen={isOpen}
        onClose={handleClose}
        className="!max-w-[500px] !w-full"
      >
        <div className="font-roboto">
          <div className="font-inter text-xl text-[#111827] font-semibold">
            Add filed
          </div>
          <hr className="border-[#E5E7EB] my-3" />
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#111827] font-inter">
                Field name
              </span>
              <Input
                wrapperClassName="!max-w-[300px] !w-full"
                className="!max-w-[300px] !w-full"
                placeholder="field name you want to import"
                value={newName}
                onChange={setNewName}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#111827] font-inter">Type</span>
              <Select
                value={type}
                placeholder="Select type"
                className="max-w-[300px] w-full"
                options={Object.values(StatementValueType)
                  .slice(0, 5)
                  .map((el) => ({
                    key: el,
                    title: el,
                  }))}
                onChange={setType}
              />
            </div>
          </div>
          <div className="flex justify-end items-center mt-6 gap-2">
            <Button
              type={ButtonType.SECONDARY}
              disabled={isLoading}
              className="!border-[#E5E7EB] !text-[#111827]"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!newName || !type || isLoading}
              type={ButtonType.PRIMARY}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </FlowBuilderModal>
    </>
  );
};

export default AddAttributeModal;
