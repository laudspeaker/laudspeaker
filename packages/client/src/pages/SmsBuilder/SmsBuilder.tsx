import { ApiConfig } from "../../constants";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import { getResources } from "pages/Segment/SegmentHelpers";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import MergeTagInput from "components/MergeTagInput";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import Progress from "components/Progress";

const SmsBuilder = () => {
  const { name } = useParams();
  const [smsMessage, setSmsMessage] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My sms template");
  const [smsTemplateId, setSmsTemplateId] = useState<string>("");
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
    } catch (e) {
      let message = "Unexpected error";
      if (e instanceof AxiosError) {
        message = e.response?.data?.message?.[0] || e.response?.data?.message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  useLayoutEffect(() => {
    const populateSlackBuilder = async () => {
      try {
        const { data } = await getTemplate(name);
        setSmsMessage(data.smsText || "");
        setTemplateName(name);
        setSmsTemplateId(data.id);
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
    const indexToInsert = focusedInput?.selectionStart || smsMessage.length;
    const newSlackMessageArr = smsMessage.split("");
    newSlackMessageArr.splice(indexToInsert, 0, "{{}}");
    setSmsMessage(newSlackMessageArr.join(""));
    setIsPreview(true);
  };

  const onAddApiCallClick = () => {
    const focusedInput = document.querySelector(
      "#slackMessage"
    ) as HTMLInputElement;
    const indexToInsert =
      focusedInput?.selectionStart || smsMessage?.length || 0;
    const newSlackMessageArr = smsMessage.split("");
    newSlackMessageArr.splice(
      indexToInsert,
      0,
      "[{[ eyAidXJsIjogImh0dHBzOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cyIsICJib2R5IjogInt9IiwgIm1ldGhvZCI6ICJHRVQiLCAiaGVhZGVycyI6IHsgIkF1dGhvcml6YXRpb24iOiAiIiB9LCAicmV0cmllcyI6IDUsICJmYWxsQmFja0FjdGlvbiI6IDAgfQ==;response.data ]}]"
    );
    setSmsMessage(newSlackMessageArr.join(""));
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
