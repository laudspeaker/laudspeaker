import { Box, Modal } from "@mui/material";
import TriggerCreater from "components/TriggerCreater";

interface ITriggerModal {
  triggerModalOpen: boolean;
  selectedTrigger: any;
  handleTriggerModalOpen: (e: any) => void;
  onSaveTrigger: any;
  onDeleteTrigger?: any;
  isCollapsible: boolean;
  onClose: () => void;
}
const TriggerModal = ({
  triggerModalOpen,
  selectedTrigger,
  handleTriggerModalOpen,
  onSaveTrigger,
  onDeleteTrigger,
  onClose,
  isCollapsible,
}: ITriggerModal) => {
  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90vw",
    bgcolor: "background.paper",
    border: 0,
    borderRadius: "10px",
    boxShadow: 24,
    p: 4,
  };

  return (
    <Modal
      open={triggerModalOpen}
      // onClose={() => handleTriggerModalOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        {isCollapsible && (
          <button
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              border: "0px",
              background: "transparent",
              outline: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            x
          </button>
        )}
        {selectedTrigger ? (
          <TriggerCreater
            triggerType={selectedTrigger.type}
            trigger={selectedTrigger}
            onSave={(triggerData: any) => onSaveTrigger(triggerData)}
            onDelete={(triggerData: any) => onDeleteTrigger(triggerData)}
          />
        ) : null}
      </Box>
    </Modal>
  );
};

export default TriggerModal;
