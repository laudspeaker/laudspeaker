import { ApiConfig } from "../../constants";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import React, { RefObject, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import Template, { TemplateType } from "types/Template";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getResources } from "pages/Segment/SegmentHelpers";
import WebhookSettings, {
  FallBackAction,
  WebhookMethod,
  WebhookState,
} from "./WebhookSettings";
import Progress from "components/Progress";

const WebhookBuilder = () => {
  const { name } = useParams();

  const [webhookState, setWebhookState] = useState<WebhookState>({
    url: "",
    method: WebhookMethod.GET,
    body: "",
    headers: {},
    retries: 5,
    fallBackAction: FallBackAction.NOTHING,
  });
  const [templateId, setTemplateId] = useState<number>();
  const [templateName, setTemplateName] = useState("My webhook template");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [selectedRef, setSelectedRef] =
    useState<RefObject<HTMLInputElement | HTMLTextAreaElement>>();
  const [selectedRefValueSetter, setSelectedRefValueSetter] = useState<{
    set: (value: string) => void;
  }>({ set: () => {} });

  const urlRef = useRef<HTMLInputElement>(null);
  const bearerTokenRef = useRef<HTMLInputElement>(null);
  const basicUserNameRef = useRef<HTMLInputElement>(null);
  const basicPasswordRef = useRef<HTMLInputElement>(null);
  const customHeaderRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const headersRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    (async () => {
      try {
        const { data } = await ApiService.get<Template>({
          url: `${ApiConfig.getAllTemplates}/${name}`,
        });

        setTemplateId(data.id);
        setTemplateName(name);
        setWebhookState(data.webhookData || webhookState);

        const { data: attributesData } = await getResources("attributes");
        setPossibleAttributes(
          attributesData.options.map(
            (option: { label: string }) => option.label
          )
        );
      } catch (e) {
        toast.error("Error while loading");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    setIsSaving(true);

    try {
      const reqBody = {
        name: templateName,
        type: TemplateType.WEBHOOK,
        webhookData: webhookState,
      };

      if (templateId) {
        await ApiService.patch({
          url: `${ApiConfig.getAllTemplates}/${name}`,
          options: {
            ...reqBody,
          },
        });
      } else {
        const { data } = await ApiService.post<Template>({
          url: `${ApiConfig.createTemplate}`,
          options: {
            ...reqBody,
          },
        });
        setTemplateId(data.id);
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

  const onPersonalizeClick = () => {
    if (!selectedRef || !selectedRef.current) return;

    if (!selectedRefValueSetter) return;

    const indexToInsert = selectedRef.current.selectionStart || 0;
    selectedRefValueSetter.set(
      selectedRef.current.value.slice(0, indexToInsert) +
        "{{ email }}" +
        selectedRef.current.value.slice(indexToInsert)
    );
  };

  const onAddTemplateClick = () => {
    if (!selectedRef || !selectedRef.current) return;

    if (!selectedRefValueSetter) return;

    const indexToInsert = selectedRef.current.selectionStart || 0;
    selectedRefValueSetter.set(
      selectedRef.current.value.slice(0, indexToInsert) +
        "[[ email;template-name;templateProperty ]]" +
        selectedRef.current.value.slice(indexToInsert)
    );
  };

  if (isLoading) return <Progress />;

  return (
    <div className="w-full">
      <SlackTemplateHeader
        onPersonalizeClick={onPersonalizeClick}
        onAddTemplateClick={onAddTemplateClick}
        onSave={onSave}
        loading={isSaving}
        templateName={templateName}
        handleTemplateNameChange={(e) => setTemplateName(e.target.value)}
      />
      <WebhookSettings
        webhookState={webhookState}
        setWebhookState={setWebhookState}
        possibleAttributes={possibleAttributes}
        setSelectedRef={setSelectedRef}
        onSave={onSave}
        urlRef={urlRef}
        bearerTokenRef={bearerTokenRef}
        basicUserNameRef={basicUserNameRef}
        basicPasswordRef={basicPasswordRef}
        customHeaderRef={customHeaderRef}
        bodyRef={bodyRef}
        headersRef={headersRef}
        setSelectedRefValueSetter={setSelectedRefValueSetter}
        selectedRef={selectedRef}
      />
    </div>
  );
};

export default WebhookBuilder;
