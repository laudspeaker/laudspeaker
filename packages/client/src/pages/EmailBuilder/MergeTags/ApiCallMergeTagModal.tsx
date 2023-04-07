import Modal from "components/Elements/Modal";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import WebhookSettings, {
  FallBackAction,
  WebhookMethod,
  WebhookState,
} from "pages/WebhookBuilder/WebhookSettings";
import React, { FC, RefObject, useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";

interface ApiCallMergeTagModalProps {
  itemContent: string;
  handleUpdateTag: (state: WebhookState, webhookProps: string) => void;
  onClose: () => void;
}

const ApiCallMergeTagModal: FC<ApiCallMergeTagModalProps> = ({
  itemContent,
  handleUpdateTag,
  onClose,
}) => {
  const [webhookStateBase64, initialWebhookProps] = itemContent
    .trim()
    .split(";");

  let initialWebhookState: WebhookState = {
    url: "https://jsonplaceholder.typicode.com/posts",
    body: "{}",
    method: WebhookMethod.GET,
    headers: { Authorization: "" },
    retries: 5,
    fallBackAction: FallBackAction.NOTHING,
  };

  try {
    initialWebhookState = JSON.parse(
      Buffer.from(webhookStateBase64, "base64").toString("utf8")
    );
  } catch {}

  const [webhookState, setWebhookState] =
    useState<WebhookState>(initialWebhookState);
  const [webhookProps, setWebhookProps] = useState(
    initialWebhookProps || "response.data"
  );

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

  useEffect(() => {
    handleUpdateTag(webhookState, webhookProps);
  }, [webhookState, webhookProps, handleUpdateTag]);

  return (
    <Modal isOpen={true} onClose={onClose} panelClass="min-w-[90vw]">
      <div className="py-[20px] px-[15px] outline-none max-h-[75vh] overflow-y-scroll flex justify-center items-center">
        <div className="w-[490px] max-h-[75vh]">
          <div className="w-full flex justify-end items-center">
            <SlackTemplateHeader
              onPersonalizeClick={onPersonalizeClick}
              onAddTemplateClick={onAddTemplateClick}
            />
          </div>
          <WebhookSettings
            webhookState={webhookState}
            setWebhookState={setWebhookState}
            webhookProps={webhookProps}
            setWebhookProps={setWebhookProps}
            urlRef={urlRef}
            bearerTokenRef={bearerTokenRef}
            basicUserNameRef={basicUserNameRef}
            basicPasswordRef={basicPasswordRef}
            customHeaderRef={customHeaderRef}
            bodyRef={bodyRef}
            headersRef={headersRef}
            setSelectedRef={setSelectedRef}
            selectedRef={selectedRef}
            setSelectedRefValueSetter={setSelectedRefValueSetter}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ApiCallMergeTagModal;
