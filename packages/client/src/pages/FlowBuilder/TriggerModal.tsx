import Modal from "../../components/Elements/Modal";
import TriggerCreater from "components/TriggerCreater";
import { Trigger, TriggerTypeName } from "types/Workflow";

interface ITriggerModal {
  selectedTrigger?: Trigger;
  onSaveTrigger: (data: Trigger) => void;
  onDeleteTrigger?: (data: string) => void;
  isCollapsible: boolean;
  isViewMode?: boolean;
  onClose: () => void;
}
const TriggerModal = ({
  selectedTrigger,
  onSaveTrigger,
  onDeleteTrigger,
  onClose,
  isViewMode = false,
  isCollapsible = true,
}: ITriggerModal) => {
  const handleClose = () => {
    const initialValue = selectedTrigger?.properties?.conditions?.[0]?.value;

    if (isViewMode && isCollapsible) onClose();
    else if (isCollapsible) {
      if (!!initialValue) onClose();
      else if (!initialValue && onDeleteTrigger && selectedTrigger?.id)
        onDeleteTrigger(selectedTrigger.id);
      else onClose();
    }
  };

  return (
    <Modal
      isOpen={!!selectedTrigger}
      panelClass="w-full !max-w-[90%] h-full max-h-full overflow-y-scroll"
      closeButtonNeed={isCollapsible}
      onClose={handleClose}
    >
      <div className="w-full bg-[background.paper] border-0 ">
        {selectedTrigger ? (
          <TriggerCreater
            triggerType={selectedTrigger.type as TriggerTypeName}
            trigger={selectedTrigger}
            isViewMode={isViewMode}
            onSave={(trigger: Trigger) => onSaveTrigger(trigger)}
            onDelete={(triggerId: string) =>
              onDeleteTrigger && onDeleteTrigger(triggerId)
            }
          />
        ) : null}
      </div>
    </Modal>
  );
};

export default TriggerModal;
