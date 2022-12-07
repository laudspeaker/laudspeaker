import Modal from "../../components/Elements/Modal";
import TriggerCreater from "components/TriggerCreater";

interface ITriggerModal {
  triggerModalOpen: boolean;
  selectedTrigger: any;
  handleTriggerModalOpen: (e: any) => void;
  onSaveTrigger: any;
  onDeleteTrigger?: any;
  isCollapsible: boolean;
  isViewMode?: boolean;
  onClose: () => void;
}
const TriggerModal = ({
  triggerModalOpen,
  selectedTrigger,
  handleTriggerModalOpen,
  onSaveTrigger,
  onDeleteTrigger,
  onClose,
  isViewMode = false,
  isCollapsible = true,
}: ITriggerModal) => {
  const handleClose = () => {
    const inVal = selectedTrigger?.properties?.conditions?.[0]?.value;

    if (isViewMode && isCollapsible) onClose();
    else if (isCollapsible) {
      if (!!inVal) onClose();
      else if (!inVal) onDeleteTrigger(selectedTrigger.id);
      else onClose();
    }
  };

  return (
    <Modal
      isOpen={!!selectedTrigger}
      panelClass="w-full !max-w-[90%]"
      closeButtonNeed={isCollapsible}
      onClose={handleClose}
    >
      <div className="w-full bg-[background.paper] border-0 ">
        {selectedTrigger ? (
          <TriggerCreater
            triggerType={selectedTrigger.type}
            trigger={selectedTrigger}
            isViewMode={isViewMode}
            onSave={(triggerData: any) => onSaveTrigger(triggerData)}
            onDelete={(triggerData: any) => onDeleteTrigger(triggerData)}
          />
        ) : null}
      </div>
    </Modal>
  );
};

export default TriggerModal;
