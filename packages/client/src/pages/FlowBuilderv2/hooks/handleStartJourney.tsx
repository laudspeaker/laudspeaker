import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { setIsStarting, JourneyType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import posthog from "posthog-js";

const useStartJourney = () => {
  const {
    flowId,
    nodes,
    edges,
    flowName,
    segments,
    journeyType,
    journeyEntrySettings,
    journeySettings,
    isStarting,
  } = useAppSelector((state) => state.flowBuilder);

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const handleStartJourney = async ({
    inProgress,
    finished,
  }: {
    inProgress?: string;
    finished?: string;
  }) => {
    if (isStarting) {
      toast.error("Journey is already starting");
      return;
    }

    dispatch(setIsStarting(true));
    toast.info(
      "Please remain on page until journey has started this can take a few minutes"
    );

    try {
      await ApiService.patch({
        url: "/journeys/visual-layout",
        options: {
          id: flowId,
          nodes,
          edges,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save layout");
      dispatch(setIsStarting(false));
      return;
    }

    try {
      await ApiService.patch({
        url: "/journeys",
        options: {
          id: flowId,
          name: flowName,
          inclusionCriteria: segments,
          isDynamic: journeyType === JourneyType.DYNAMIC,
          journeyEntrySettings,
          journeySettings,
          versions: { inProgress, finished },
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save journey properties");
      dispatch(setIsStarting(false));
      return;
    }

    try {
      await ApiService.patch({ url: "/journeys/start/" + flowId });

      toast.success("Journey has been started");
      posthog.capture("journey_started_success");

      navigate(`/flow/${flowId}/view`);
    } catch (e) {
      toast.error("Failed to start journey");
      posthog.capture("journey_started_fail");
    }

    dispatch(setIsStarting(false));
  };

  return handleStartJourney;
};

export default useStartJourney;
