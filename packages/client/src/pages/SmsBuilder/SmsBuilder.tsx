import { ApiConfig } from "../../constants";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import { getResources } from "pages/Segment/SegmentHelpers";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import MergeTagInput from "components/MergeTagInput";

const SmsBuilder = () => {
  const { name } = useParams();
  const [smsMessage, setSmsMessage] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My sms template");
  const [smsTemplateId, setSmsTemplateId] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(true);

  const inputRef = useRef<HTMLInputElement>();

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  const onSave = async () => {
    const reqBody = {
      name: templateName,
      text: smsMessage,
      type: "sms",
    };

    if (!smsTemplateId) {
      const response = await ApiService.post({
        url: `${ApiConfig.createTemplate}`,
        options: {
          ...reqBody,
        },
      });
      setSmsTemplateId(response.data.id);
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
      setSmsMessage(data.text);
      setTemplateName(name);
      setSmsTemplateId(data.id);
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
    const indexToInsert = focusedInput?.selectionStart || smsMessage.length;
    const newSlackMessageArr = smsMessage.split("");
    newSlackMessageArr.splice(indexToInsert, 0, "{{}}");
    setSmsMessage(newSlackMessageArr.join(""));
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
          value={smsMessage}
          placeholder={"Sms Message"}
          name="smsMessage"
          id="smsMessage"
          fullWidth
          setValue={setSmsMessage}
          onChange={(e: any) => setSmsMessage(e.target.value)}
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

export default SmsBuilder;
