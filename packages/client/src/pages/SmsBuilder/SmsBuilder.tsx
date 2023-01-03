import { ApiConfig } from "../../constants";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import { getResources } from "pages/Segment/SegmentHelpers";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import MergeTagInput from "components/MergeTagInput";
import { toast } from "react-toastify";

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
    try {
      const reqBody = {
        name: templateName,
        smsText: smsMessage,
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
    } catch (e: any) {
      toast.error(
        e.response?.data?.message?.[0] ||
          e.response?.data?.message ||
          "Unexpected error"
      );
    }
  };

  useLayoutEffect(() => {
    const populateSlackBuilder = async () => {
      const { data } = await getTemplate(name);
      setSmsMessage(data.smsText);
      setTemplateName(name);
      setSmsTemplateId(data.id);
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
        handleTemplateNameChange={(e) => setTemplateName(e.target.value)}
      />
      <div style={{ width: "490px", margin: "auto" }}>
        <MergeTagInput
          isRequired
          value={smsMessage}
          placeholder={"SMS Message"}
          name="smsMessage"
          id="smsMessage"
          fullWidth
          setValue={setSmsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          labelShrink
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          possibleAttributes={possibleAttributes}
          inputRef={inputRef}
        />
        <div className="text-gray-500">
          <h3>Things you should notice:</h3>
          <div className="text-[12px]">
            <div>
              * if message length is over 160 it will be splitted into multiple
              parts
            </div>
            <div>
              * if message length is over 1600 it will be limited to first 1600
              characters to meet system's requirements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsBuilder;
