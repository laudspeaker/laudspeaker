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
  isCollapsible,
}: ITriggerModal) => {
  return (
    <Modal
      isOpen={!!selectedTrigger}
      panelClass="w-full !max-w-[90%]"
      closeButtonNeed={isViewMode}
      onClose={isViewMode ? onClose : () => null}
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
