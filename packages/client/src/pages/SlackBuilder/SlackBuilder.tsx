import "grapesjs/dist/css/grapes.min.css";
import { useState, useLayoutEffect, RefObject, useRef } from "react";
import Drawer from "../../components/Drawer";
import SlackTemplateHeader from "./SlackTemplateHeader";
import { Input } from "../../components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useParams } from "react-router-dom";
import CustomInput from "./CustomInput/CustomInput";
import { getResources } from "pages/Segment/SegmentHelpers";

const SlackBuilder = () => {
  const { name } = useParams();
  const [slackMessage, setSlackMessage] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My slack template");
  const [slackTemplateId, setSlackTemplateId] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [editor] = useState<any>();

  const inputRef = useRef<HTMLInputElement>();

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
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

  const onSave = async () => {
    const reqBody = {
      name: templateName,
      slackMessage: slackMessage,
      type: "slack",
    };
    if (slackTemplateId == null) {
      const response = await ApiService.post({
        url: `${ApiConfig.createTemplate}`,
        options: {
          ...reqBody,
        },
      });
      setSlackTemplateId(response.data.id);
    } else {
      const response = await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${name}`,
        options: {
          ...reqBody,
        },
      });
    }
  };

  const onPersonalizeClick = () => {
    console.log(inputRef);
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
    <>
      <Drawer />
      <SlackTemplateHeader
        onPersonalizeClick={onPersonalizeClick}
        onSave={onSave}
        templateName={templateName}
        handleTemplateNameChange={(e: any) => setTemplateName(e.target.value)}
      />
      <div style={{ width: "490px", margin: "auto" }}>
        <CustomInput
          isRequired
          value={slackMessage}
          placeholder={"Slack Message"}
          name="slackMessage"
          id="slackMessage"
          fullWidth
          setValue={setSlackMessage}
          onChange={(e: any) => setSlackMessage(e.target.value)}
          labelShrink
          sx={{
            marginBottom: "30px",
          }}
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          possibleAttributes={possibleAttributes}
          ref={inputRef}
        />
      </div>
    </>
  );
};

export default SlackBuilder;
