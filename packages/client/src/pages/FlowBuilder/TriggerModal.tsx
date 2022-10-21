import Modal from "../../components/Elements/Modal";
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
  return (
    <Modal
      isOpen={!!selectedTrigger}
      panelClass="w-full !max-w-[90%]"
      closeButtonNeed={false}
    >
      <div className="w-full bg-[background.paper] border-0 ">
        {selectedTrigger ? (
          <TriggerCreater
            triggerType={selectedTrigger.type}
            trigger={selectedTrigger}
            onSave={(triggerData: any) => onSaveTrigger(triggerData)}
            onDelete={(triggerData: any) => onDeleteTrigger(triggerData)}
          />
        ) : null}
      </div>
    </Modal>
  );
};

export default TriggerModal;
