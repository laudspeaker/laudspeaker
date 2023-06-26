import FlowBuilderDrawer from "pages/FlowBuilderv2/Drawer/FlowBuilderDrawer";
import FlowEditor from "pages/FlowBuilderv2/FlowEditor";
import React, { useEffect } from "react";
import OnboardingStepper from "./Stepper/OnboardingStepper";

const OnboardingSandbox = () => {
  useEffect(() => {}, []);

  return (
    <div className="min-h-screen h-screen flex flex-col p-[20px]">
      <OnboardingStepper />
      <div className="bg-[#F3F4F6] rounded-[25px] h-full overflow-hidden p-[20px] flex">
        <FlowBuilderDrawer />
        <FlowEditor />
      </div>
    </div>
  );
};

export default OnboardingSandbox;
