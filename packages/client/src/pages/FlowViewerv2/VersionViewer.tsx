import FlowEditor from "pages/FlowBuilderv2/FlowEditor";

const VersionViewer = () => {
  return (
    <div className="relative w-full h-full text-[#111827] font-inter font-normal text-[14px] leading-[22px]">
      <FlowEditor isViewMode={true} className="bg-[#F9FAFB]" />
    </div>
  );
};

export default VersionViewer;
