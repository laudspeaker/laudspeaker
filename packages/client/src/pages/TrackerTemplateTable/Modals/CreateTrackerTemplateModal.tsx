import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Modal from "components/Elements/Modalv2";
import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import Template from "types/Template";

interface CreateTrackerTemplateModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const CreateTrackerTemplateModal: FC<CreateTrackerTemplateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const createTrackerTemplate = async () => {
    try {
      const {
        data: { name: requestName },
      } = await ApiService.post<Template>({
        url: "/templates/create",
        options: { name, type: "custom_component" },
      });

      navigate("/tracker-template/" + requestName);
    } catch (e) {
      console.error(e);

      toast.error("Error while saving");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[10px]">
        <Input value={name} onChange={setName} placeholder="Template name" />

        <Button
          className="w-fit"
          type={ButtonType.PRIMARY}
          onClick={createTrackerTemplate}
        >
          Create template
        </Button>
      </div>
    </Modal>
  );
};

export default CreateTrackerTemplateModal;
