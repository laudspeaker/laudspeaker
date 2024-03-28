import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import FilterBuilder from "pages/FlowBuilderv2/FilterBuilder/FilterBuilder";
import { DragEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Query } from "reducers/flow-builder.reducer";
import {
  setAvailableTags,
  setSegmentsSettings,
  setSettingsToDefault,
  setShowSegmentsErrors,
} from "reducers/segment.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SegmentType } from "types/Segment";

export const validateStatementsLength = (q: Query) => {
  if (q.statements.length === 0)
    throw new Error("Each logic group should have at least one statement");

  const logicGroups = q.statements.filter(
    (el) => (el as Query)?.isSubBuilderChild
  );
  if (logicGroups.length > 0) {
    logicGroups.forEach((el) => {
      validateStatementsLength(el as Query);
    });
  }
  return;
};

const SegmentBuilder = () => {
  const { id } = useParams();

  const { segment, segmentQueryErrors } = useAppSelector(
    (state) => state.segment
  );
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentType, setSegmentType] = useState(SegmentType.AUTOMATIC);
  const [isLoadingSegment, setIsLoadingSegment] = useState(false);

  const navigate = useNavigate();

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
    try {
      validateStatementsLength(segment.query);
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }
    setIsLoadingSegment(true);

    //create segment
    try {
      const { data } = await ApiService.post({
        url: "/segments/",
        options: {
          name: name,
          description: description,
          type: segmentType,
          inclusionCriteria: segment,
        },
      });
      navigate("/segment/" + data.id);
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save segment");
    }
    setIsLoadingSegment(false);
  };

  const handleUpdateClick = async () => {
    console.log("***oi oi ***");
    console.log("/n\ntrying inclusion criteria with", segment);
    //console.log("the object is", JSON.stringify(Object, undefined, 2));
    if (Object.values(segmentQueryErrors).length > 0) {
      dispatch(setShowSegmentsErrors(true));
      return;
    }
    //update segment
    setIsLoadingSegment(true);
    try {
      await ApiService.patch({
        url: "/segments/" + id,
        options: {
          name: name,
          description: description,
          type: segmentType,
          inclusionCriteria: segment,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save segment");
    }
    setIsLoadingSegment(false);
  };

  const loadSegment = async () => {
    if (!id) return;
    setIsLoadingSegment(true);

    try {
      const { data } = await ApiService.get({ url: "/segments/" + id });
      if (data.type !== SegmentType.AUTOMATIC) {
        toast.warning(
          "Our apologize, manual segment viewer still in progress."
        );
        navigate("/segment");
        return;
      }

      setName(data.name);
      setDescription(data.description || "");
      dispatch(setSegmentsSettings(data.inclusionCriteria));
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data.message || "Unexpected error loading segment"
        );
        navigate("/segment");
        return;
      }
    }
    setIsLoadingSegment(false);
  };

  useEffect(() => {
    (async () => {
      setIsLoadingSegment(true);
      try {
        await loadAllTags();
        if (id) await loadSegment();
      } catch (error) {}
      setIsLoadingSegment(false);
    })();
    return () => {
      dispatch(setShowSegmentsErrors(false));
      dispatch(setSettingsToDefault());
    };
  }, []);

  return (
    <div
      className={`${
        isLoadingSegment &&
        "pointer-events-none cursor-wait opacity-70 animate-pulse"
      } `}
    >
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
          disabled={!name || isLoadingSegment}
          onClick={id ? handleUpdateClick : handleSaveClick}
          id="saveSegmentButton"
        >
          {id ? "Update" : "Save"}
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
