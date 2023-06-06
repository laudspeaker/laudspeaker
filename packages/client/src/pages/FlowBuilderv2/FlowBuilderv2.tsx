import React, { useEffect } from "react";
import FlowBuilderDrawer from "./Drawer/FlowBuilderDrawer";
import FlowBuilderHeader from "./Header/FlowBuilderHeader";
import FlowEditor from "./FlowEditor";
import { useThrottle } from "react-use";
import { useAppSelector } from "store/hooks";
import FlowBuilderSegmentEditor from "./FlowBuilderSegmentEditor";
import FlowBuilderReview from "./FlowBuilderReview";

const FlowBuilderv2 = () => {
  const flowBuilderState = useAppSelector((state) => state.flowBuilder);

  const throttledFlowBuilderState = useThrottle(flowBuilderState, 1000);

  useEffect(() => {
    console.log("To save: ");
    console.log(throttledFlowBuilderState);
  }, [throttledFlowBuilderState]);

  return (
    <div className="relative w-full h-full max-h-[calc(100%-46px)]">
      <FlowBuilderHeader />
      <div className="relative flex w-full h-full max-h-[calc(100%-60px)]">
        {flowBuilderState.stepperIndex === 0 && <FlowBuilderDrawer />}

        {flowBuilderState.stepperIndex === 0 ? (
          <FlowEditor />
        ) : flowBuilderState.stepperIndex === 1 ? (
          <FlowBuilderSegmentEditor />
        ) : (
          <FlowBuilderReview />
        )}
      </div>
    </div>
  );
};

export default FlowBuilderv2;
