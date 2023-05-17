import React from "react";
import FlowBuilderDrawer from "./FlowBuilderDrawer";
import FlowBuilderHeader from "./FlowBuilderHeader";
import FlowEditor from "./FlowEditor";

const FlowBuilderv3 = () => {
  return (
    <div className="relative w-full h-full max-h-[calc(100%-46px)]">
      <FlowBuilderHeader />
      <div className="relative flex w-full h-full max-h-[calc(100%-60px)]">
        <FlowBuilderDrawer />
        <FlowEditor />
      </div>
    </div>
  );
};

export default FlowBuilderv3;
