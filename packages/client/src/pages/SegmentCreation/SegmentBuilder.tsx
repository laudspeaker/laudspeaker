import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import FilterBuilder from "pages/FlowBuilderv2/FilterBuilder/FilterBuilder";
import { DragEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  setAvailableTags,
  setSegmentsSettings,
  setShowSegmentsErrors,
} from "reducers/segment.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SegmentType } from "types/Segment";

const SegmentBuilder = () => {
  const { segment, segmentQueryErrors } = useAppSelector(
    (state) => state.segment
  );
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentType, setSegmentType] = useState(SegmentType.AUTOMATIC);

  const loadAllTags = async () => {
    try {
      const { data } = await ApiService.get<string[]>({
        url: "/journeys/tags",
      });

      dispatch(setAvailableTags(data));
    } catch (error) {
      dispatch(setAvailableTags([]));
    }
  };

  const handleSaveClick = async () => {
    console.log("***oi oi ***");
    console.log("/n\ntrying inclusion criteria with", segment);
    //console.log("the object is", JSON.stringify(Object, undefined, 2));
    if (Object.values(segmentQueryErrors).length > 0) {
      dispatch(setShowSegmentsErrors(true));
      return;
    }
    //create segment
    try {
      await ApiService.post({
        url: "/segments/",
        options: {
          name: name,
          type: segmentType,
          inclusionCriteria: segment,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save segment");
    }
  };

  useEffect(() => {
    loadAllTags();
    return () => {
      dispatch(setShowSegmentsErrors(false));
    };
  }, []);

  return (
    <div>
      <div className="mb-[10px] flex items-center">
        <div className="w-[76px] mr-[15px] font-inter text-[14px] leading-[22px] text-[#18181B]">
          Name
        </div>
        <Input
          value={name}
          placeholder={"Segment name"}
          name="segmentName"
          id="segmentName"
          onChange={(val) => setName(val)}
        />
      </div>
      <div className="mb-[20px] flex items-start">
        <div className="w-[76px] mr-[15px] font-inter text-[14px] leading-[22px] text-[#18181B]">
          Description
        </div>
        <textarea
          className="border border-[#E5E7EB] rounded px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none"
          value={description}
          placeholder={"Segment description"}
          name="segmentDescription"
          id="segmentDescription"
          onChange={(ev) => setDescription(ev.target.value || "")}
        />
      </div>
      <div className="mb-[10px] font-inter font-semibold text-base text-[#111827]">
        Segment type
      </div>
      <div className="flex gap-5 mb-[20px]">
        <div
          className={`w-[340px] px-5 py-[10px] flex flex-col gap-[10px] rounded select-none cursor-pointer ${
            segmentType === SegmentType.AUTOMATIC
              ? "border-2 border-[#6366F1] bg-[#EEF2FF]"
              : "border border-[#E5E7EB]"
          }`}
          onClick={() => setSegmentType(SegmentType.AUTOMATIC)}
        >
          <div className="font-semibold font-inter text-base">
            Automatic segment
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            A segment defined by the following set of filters and conditions
          </div>
        </div>

        <div
          className={`w-[340px] px-5 py-[10px] flex flex-col gap-[10px] rounded select-none cursor-pointer ${
            segmentType === SegmentType.MANUAL
              ? "border-2 border-[#6366F1] bg-[#EEF2FF]"
              : "border border-[#E5E7EB]"
          }`}
          onClick={() => setSegmentType(SegmentType.MANUAL)}
        >
          <div className="font-semibold font-inter text-base">
            Manual segment
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            A segment defined by a list of users, by csv upload or otherwise
          </div>
        </div>
      </div>
      <div className="mb-[10px] font-inter font-semibold text-base">
        {segmentType === SegmentType.AUTOMATIC ? "Conditions" : "CSV file"}
      </div>
      {segmentType === SegmentType.AUTOMATIC ? (
        <>
          <FilterBuilder
            settings={segment}
            isSegmentSettings
            onSettingsChange={(settings) =>
              dispatch(setSegmentsSettings(settings))
            }
          />
        </>
      ) : (
        <span className="font-inter text-base text-[#111827]">
          To create manual segment with imported customers please use{" "}
          <Link
            className="text-[#6366F1] font-medium underline"
            to="/people/import"
          >
            import page.
          </Link>
        </span>
      )}
      <div className="mt-[30px] flex gap-[10px]">
        <Button
          type={ButtonType.PRIMARY}
          className="!text-[white]"
          onClick={handleSaveClick}
        >
          Save
        </Button>
        <Link to="/segment">
          <Button
            type={ButtonType.SECONDARY}
            className="!border-[#E5E7EB] !text-black"
            onClick={() => null}
          >
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SegmentBuilder;
