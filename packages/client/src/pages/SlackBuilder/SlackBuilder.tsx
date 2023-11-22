import "grapesjs/dist/css/grapes.min.css";
import { useState, useLayoutEffect, useRef } from "react";
import SlackTemplateHeader from "./SlackTemplateHeader";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useParams } from "react-router-dom";
import MergeTagInput from "../../components/MergeTagInput/MergeTagInput";
import { getResources } from "pages/Segment/SegmentHelpers";
import { toast } from "react-toastify";
import Progress from "components/Progress";

const SlackBuilder = () => {
  const { id } = useParams();
  const [slackMessage, setSlackMessage] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My slack template");
  const [slackTemplateId, setSlackTemplateId] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      const reqBody = {
        name: templateName,
        slackMessage: slackMessage,
        type: "slack",
      };

      await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${id}`,
        options: {
          ...reqBody,
        },
      });
    } catch (e) {
      toast.error("Error while saving");
    } finally {
      setIsSaving(false);
    }
  };

  useLayoutEffect(() => {
    const populateSlackBuilder = async () => {
      try {
        const { data } = await getTemplate(id);
        setSlackMessage(data.slackMessage || "");
        setTemplateName(id);
        setSlackTemplateId(data.id);
      } catch (e) {
        toast.error("Error while loading");
      } finally {
        setIsLoading(false);
      }
    };
    const loadAttributes = async () => {
      const { data } = await getResources("attributes");
      setPossibleAttributes(
        data.options.map((option: { label: string }) => option.label)
      );
    };
    populateSlackBuilder();
    loadAttributes();
  }, []);

  const onPersonalizeClick = () => {
    const focusedInput = document.querySelector(
      "#slackMessage"
    ) as HTMLInputElement;
    const indexToInsert =
      focusedInput?.selectionStart || slackMessage?.length || 0;
    const newSlackMessageArr = slackMessage.split("");
    newSlackMessageArr.splice(indexToInsert, 0, "{{}}");
    setSlackMessage(newSlackMessageArr.join(""));
    setIsPreview(true);
  };

  const onAddApiCallClick = () => {
    const focusedInput = document.querySelector(
      "#slackMessage"
    ) as HTMLInputElement;
    const indexToInsert =
      focusedInput?.selectionStart || slackMessage?.length || 0;
    const newSlackMessageArr = slackMessage.split("");
    newSlackMessageArr.splice(
      indexToInsert,
      0,
      "[{[ eyAidXJsIjogImh0dHBzOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cyIsICJib2R5IjogInt9IiwgIm1ldGhvZCI6ICJHRVQiLCAiaGVhZGVycyI6IHsgIkF1dGhvcml6YXRpb24iOiAiIiB9LCAicmV0cmllcyI6IDUsICJmYWxsQmFja0FjdGlvbiI6IDAgfQ==;response.data ]}]"
    );
    setSlackMessage(newSlackMessageArr.join(""));
    setIsPreview(true);
  };

  if (isLoading) return <Progress />;

  return (
    <div className="w-full">
      <SlackTemplateHeader
        onPersonalizeClick={onPersonalizeClick}
        onAddApiCallClick={onAddApiCallClick}
        onSave={onSave}
        loading={isSaving}
        templateName={templateName}
        handleTemplateNameChange={(e) => setTemplateName(e.target.value)}
      />
      <div style={{ width: "490px", margin: "auto" }}>
        <MergeTagInput
          isRequired
          value={slackMessage}
          placeholder={"Slack Message"}
          name="slackMessage"
          id="slackMessage"
          fullWidth
          setValue={setSlackMessage}
          onChange={(e) => setSlackMessage(e.target.value)}
          labelShrink
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          possibleAttributes={possibleAttributes}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
};

export default SlackBuilder;
