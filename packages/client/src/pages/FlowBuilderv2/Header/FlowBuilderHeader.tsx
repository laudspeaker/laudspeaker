import React, { useState } from "react";
import { toast } from "react-toastify";
import { setStepperIndex } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowBuilderButton from "../Elements/FlowBuilderButton";
import FlowBuilderStepper from "../Elements/FlowBuilderStepper";
import FlowBuilderRenameModal from "../Modals/FlowBuilderRenameModal";

const FlowBuilderHeader = () => {
  const dispatch = useAppDispatch();

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const { flowName, stepperIndex, flowId } = useAppSelector(
    (state) => state.flowBuilder
  );

  const handleNextStep = () => {
    if (stepperIndex !== 2)
      dispatch(setStepperIndex((stepperIndex + 1) as 1 | 2));
  };

  const handleStartJourney = async () => {
    try {
      await ApiService.patch({ url: "/journeys/start/" + flowId });

      toast.success("Journey has been started");
    } catch (e) {
      toast.error("Failed to start journey");
    }
  };

  return (
    <div className="w-full flex justify-between items-center h-[60px] border-[1px] border-[#E5E7EB] bg-white font-segoe font-normal text-[16px] text-[#111827] leading-[24px]">
      <div className="flex items-center ml-[16px]">
        <div className="text-ellipsis max-w-[260px] overflow-hidden mr-[16px]">
          {flowName}
        </div>
        <div
          className="cursor-pointer"
          onClick={() => setIsRenameModalOpen(true)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_2222_57368)">
              <path
                d="M3.45921 12.284C3.49492 12.284 3.53064 12.2805 3.56635 12.2751L6.56992 11.7483C6.60564 11.7412 6.63957 11.7251 6.66457 11.6983L14.2342 4.12868C14.2508 4.11216 14.2639 4.09254 14.2729 4.07094C14.2818 4.04934 14.2864 4.02618 14.2864 4.00279C14.2864 3.9794 14.2818 3.95625 14.2729 3.93464C14.2639 3.91304 14.2508 3.89342 14.2342 3.8769L11.2664 0.907254C11.2324 0.873326 11.1878 0.855469 11.1396 0.855469C11.0914 0.855469 11.0467 0.873326 11.0128 0.907254L3.44314 8.4769C3.41635 8.50368 3.40028 8.53583 3.39314 8.57154L2.86635 11.5751C2.84898 11.6708 2.85519 11.7692 2.88443 11.862C2.91368 11.9547 2.96509 12.0389 3.03421 12.1073C3.15207 12.2215 3.30028 12.284 3.45921 12.284ZM4.66278 9.16975L11.1396 2.69475L12.4485 4.00368L5.97171 10.4787L4.38421 10.759L4.66278 9.16975ZM14.5717 13.784H1.42885C1.11278 13.784 0.857422 14.0394 0.857422 14.3555V14.9983C0.857422 15.0769 0.921708 15.1412 1.00028 15.1412H15.0003C15.0789 15.1412 15.1431 15.0769 15.1431 14.9983V14.3555C15.1431 14.0394 14.8878 13.784 14.5717 13.784Z"
                fill="#6366F1"
              />
            </g>
            <defs>
              <clipPath id="clip0_2222_57368">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <FlowBuilderRenameModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
        />
      </div>
      <FlowBuilderStepper />
      {stepperIndex === 2 ? (
        <FlowBuilderButton onClick={handleStartJourney} className="mr-[20px]">
          Start journey
        </FlowBuilderButton>
      ) : (
        <FlowBuilderButton onClick={handleNextStep} className="mr-[20px]">
          Next
        </FlowBuilderButton>
      )}
    </div>
  );
};

export default FlowBuilderHeader;
