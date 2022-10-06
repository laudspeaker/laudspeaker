import "grapesjs/dist/css/grapes.min.css";
import { useState, useLayoutEffect } from "react";
import Drawer from "../../components/Drawer";
import SlackTemplateHeader from "./SlackTemplateHeader";
import { Input } from "../../components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useParams } from "react-router-dom";

const SlackBuilder = () => {
  const { name } = useParams();
  const [slackMessage, setSlackMessage] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My slack template");
  const [slackTemplateId, setSlackTemplateId] = useState<string>("");
  const [editor] = useState<any>();

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
    populateSlackBuilder();
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

  const onExport = () => {
    console.log("export");
    console.log(editor.getHtml());
  };

  return (
    <>
      <Drawer />
      <SlackTemplateHeader
        onExport={onExport}
        onSave={onSave}
        templateName={templateName}
        handleTemplateNameChange={(e: any) => setTemplateName(e.target.value)}
      />
      <div style={{ width: "490px", margin: "auto" }}>
        <Input
          isRequired
          value={slackMessage}
          placeholder={"Slack Message"}
          name="slackMessage"
          id="slackMessage"
          fullWidth
          onChange={(e: any) => setSlackMessage(e.target.value)}
          labelShrink
          sx={{
            marginBottom: "30px",
          }}
        />
      </div>
    </>
  );
};

export default SlackBuilder;
