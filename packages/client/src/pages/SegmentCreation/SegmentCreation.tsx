import Scrollbars from "react-custom-scrollbars-2";
import SegmentBuilder from "./SegmentBuilder";

const SegmentCreation = () => {
  return (
    <div>
      <div className="w-full bg-white py-[34px] mb-[20px] pl-[40px] font-inter font-semibold text-[20px] leading-[28px] text-[#111827] border-[#E5E7EB] border-t">
        Create Segment
      </div>
      <div className="px-5 pb-[20px] h-[calc(100vh-162px)]">
        <Scrollbars className="bg-white h-full">
          <div className="h-full flex flex-col p-5">
            <SegmentBuilder />
          </div>
        </Scrollbars>
      </div>
    </div>
  );
};

export default SegmentCreation;
