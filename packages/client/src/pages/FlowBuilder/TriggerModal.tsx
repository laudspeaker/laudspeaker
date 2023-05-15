import TriggerCreater from "components/TriggerCreater";
import { Trigger, TriggerType } from "types/Workflow";
import SideModal from "components/Elements/SideModal";
import { useAppSelector } from "store/hooks";

interface ITriggerModal {
  onSaveTrigger: (data: Trigger) => void;
  onDeleteTrigger?: (data: string) => void;
  isCollapsible: boolean;
  isViewMode?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}
const TriggerModal = ({
  onSaveTrigger,
  onDeleteTrigger,
  onClose,
  isViewMode = false,
  isCollapsible = true,
  isOpen,
}: ITriggerModal) => {
  const { triggers, selectedTriggerId } = useAppSelector(
    (state) => state.flowBuilder
  );

  const selectedTrigger = triggers.find(
    (trigger) => trigger.id === selectedTriggerId
  );

  const handleClose = () => {
    const triggerType = selectedTrigger?.type as TriggerType;
    let initialValue: string | undefined = undefined;

    if (triggerType === TriggerType.EVENT)
      initialValue = selectedTrigger?.properties?.conditions?.[0]?.value;

    if (triggerType === TriggerType.TIME_DELAY)
      initialValue =
        selectedTrigger?.properties?.eventTime === "SpecificTime"
          ? selectedTrigger.properties.specificTime
          : selectedTrigger?.properties?.delayTime;

    if (triggerType === TriggerType.TIME_WINDOW)
      initialValue =
        selectedTrigger?.properties?.fromTime &&
        selectedTrigger.properties.toTime;

    if (isViewMode && isCollapsible) onClose();
    else if (isCollapsible) {
      if (!!initialValue) onClose();
      else if (!initialValue && onDeleteTrigger && selectedTrigger?.id)
        onDeleteTrigger(selectedTrigger.id);
      else onClose();
    }
  };

  return (
    <SideModal
      isOpen={!!isOpen && !!selectedTrigger}
      panelClass="h-full max-h-full overflow-y-scroll"
      closeButtonNeed={isCollapsible}
      onClose={handleClose}
    >
      <div className="w-full bg-[background.paper] border-0 ">
        {selectedTrigger && (
          <TriggerCreater
            triggerType={selectedTrigger.type as TriggerType}
            trigger={selectedTrigger}
            isViewMode={isViewMode}
            onSave={(trigger: Trigger) => onSaveTrigger(trigger)}
            onDelete={(triggerId: string) =>
              onDeleteTrigger && onDeleteTrigger(triggerId)
            }
          />
        )}
      </div>
    </SideModal>
  );
};

export default TriggerModal;
