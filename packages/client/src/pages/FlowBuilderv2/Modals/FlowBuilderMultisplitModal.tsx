import Button, { ButtonType } from "components/Elements/Buttonv2";
import React, { Suspense, useEffect, useState } from "react";
import {
  ConditionalSegmentsSettings,
  SegmentsSettingsType,
} from "reducers/flow-builder.reducer";
import deepCopy from "utils/deepCopy";
import FlowBuilderModal from "../Elements/FlowBuilderModal";
import FilterViewer from "../FilterViewer/FilterViewer";
const FilterBuilder = React.lazy(
  () => import("../FilterBuilder/FilterBuilder")
);

interface FlowBuilderMultisplitModalProps {
  isOpen: boolean;
  branch?: ConditionalSegmentsSettings;
  index?: number;
  onClose: () => void;
  onSave: (branch: ConditionalSegmentsSettings) => void;
  isViewMode?: boolean;
}

const defaultObject = {
  type: SegmentsSettingsType.CONDITIONAL,
  query: {
    type: "any",
    statements: [],
  },
} as ConditionalSegmentsSettings;

const FlowBuilderMultisplitModal = ({
  isOpen,
  branch,
  index,
  onClose,
  onSave,
  isViewMode,
}: FlowBuilderMultisplitModalProps) => {
  const [bufferBranch, setBufferBranch] = useState(
    deepCopy(branch) || defaultObject
  );
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [showErrors, setShowErrors] = useState(false);

  const handleCancel = () => {
    onClose();
  };

  const handleSave = () => {
    console.log("in handle save");
    if (Object.keys(errors).length) {
      setShowErrors(true);
      return;
    }
    console.log("the segment data is", JSON.stringify(bufferBranch, null, 2));

    onSave(bufferBranch);
  };

  const addError = (key: string) => {
    setErrors((prev) => {
      prev[key] = true;
      return prev;
    });
  };

  const removeError = (key: string) => {
    setErrors((prev) => {
      delete prev[key];
      return prev;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setShowErrors(false);
      setErrors({});
      setBufferBranch(deepCopy(branch) || defaultObject);
    }
  }, [isOpen]);

  return (
    <FlowBuilderModal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[864px] !max-h-[800px] !w-full"
    >
      <div className="w-full flex-col">
        <span className="text-[#111827] font-inter leading-[28px] text-[20px] font-semibold block mb-[8px]">
          {branch ? `Branch ${index || 0 + 1}` : "New branch"}
        </span>
        <div className="max-h-[584px] min-h-[500px] overflow-y-auto">
          <Suspense fallback={<></>}>
            {isViewMode ? (
              <FilterViewer settingsQuery={bufferBranch.query} />
            ) : (
              <FilterBuilder
                settings={bufferBranch}
                isMultisplitBuilder
                onSettingsChange={(newData) => {
                  setBufferBranch(newData as ConditionalSegmentsSettings);
                }}
                shouldShowErrors={showErrors}
                queryErrorsActions={{
                  add: addError,
                  remove: removeError,
                }}
              />
            )}
          </Suspense>
        </div>
      </div>
      <div className="flex justify-end items-center gap-[10px] mt-6">
        <Button type={ButtonType.SECONDARY} onClick={handleCancel}>
          {isViewMode ? "OK" : "Cancel"}
        </Button>

        {!isViewMode && (
          <Button type={ButtonType.PRIMARY} onClick={handleSave}>
            {branch ? "Save" : "Add"}
          </Button>
        )}
      </div>
    </FlowBuilderModal>
  );
};

export default FlowBuilderMultisplitModal;
