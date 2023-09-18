import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Modal from "components/Elements/Modalv2";
import Progress from "components/Progress";
import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { Workflow } from "types/Workflow";

interface NameJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NameJourneyModal: FC<NameJourneyModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [flowName, setFlowName] = useState("");

  const createJourney = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.post<Workflow>({
        url: "/journeys",
        options: { name: flowName },
      });
      navigate("/flow/" + data.id);
    } catch (err) {
      let message = "Unexpected error";
      if (err instanceof AxiosError) message = err.response?.data.message;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <Progress />
      ) : (
        <>
          <Input
            value={flowName}
            onChange={setFlowName}
            placeholder="Journey name"
            id="journey-name-input"
          />

          <div className="w-full flex justify-end">
            <Button
              type={ButtonType.PRIMARY}
              onClick={createJourney}
              id="create-journey-modal-button"
            >
              Create journey
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default NameJourneyModal;
