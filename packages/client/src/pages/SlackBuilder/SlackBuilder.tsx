import "grapesjs/dist/css/grapes.min.css";
import { useState, useLayoutEffect, useRef } from "react";
import SlackTemplateHeader from "./SlackTemplateHeader";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useParams } from "react-router-dom";
import MergeTagInput from "../../components/MergeTagInput/MergeTagInput";
import { getResources } from "pages/Segment/SegmentHelpers";

const SlackBuilder = () => {
  const { name } = useParams();
  const [slackMessage, setSlackMessage] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My slack template");
  const [slackTemplateId, setSlackTemplateId] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  const onSave = async () => {
    const reqBody = {
      name: templateName,
      slackMessage: slackMessage,
      type: "slack",
    };
    if (!slackTemplateId) {
      const response = await ApiService.post({
        url: `${ApiConfig.createTemplate}`,
        options: {
          ...reqBody,
        },
      });
      setSlackTemplateId(response.data.id);
    } else {
      await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${name}`,
        options: {
          ...reqBody,
        },
      });
    }
  };

  useLayoutEffect(() => {
    const populateSlackBuilder = async () => {
      const { data } = await getTemplate(name);
      setSlackMessage(data.slackMessage);
      setTemplateName(name);
      setSlackTemplateId(data.id);
    };
    const loadAttributes = async () => {
      const { data } = await getResources("attributes");
      setPossibleAttributes(data.options.map((option: any) => option.label));
    };
    populateSlackBuilder();
    loadAttributes();
  }, []);

  const onPersonalizeClick = () => {
    const focusedInput = document.querySelector(
      "#slackMessage"
    ) as HTMLInputElement;
    const indexToInsert = focusedInput?.selectionStart || slackMessage.length;
    const newSlackMessageArr = slackMessage.split("");
    newSlackMessageArr.splice(indexToInsert, 0, "{{}}");
    setSlackMessage(newSlackMessageArr.join(""));
    setIsPreview(true);
  };

  return (
    <div className="w-full">
      <SlackTemplateHeader
        onPersonalizeClick={onPersonalizeClick}
        onSave={onSave}
        templateName={templateName}
        handleTemplateNameChange={(e: any) => setTemplateName(e.target.value)}
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
          onChange={(e: any) => setSlackMessage(e.target.value)}
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
