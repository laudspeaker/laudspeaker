import Chip from "components/Elements/Chip";
import React, { FC, RefObject, useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";
import WebhookSettings, {
  FallBackAction,
  WebhookMethod,
  WebhookState,
} from "pages/WebhookBuilder/WebhookSettings";
import Modal from "components/Elements/Modal";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";

interface ApiCallTagPickerProps {
  itemContent: string;
  handleValueReplace: (regExp: RegExp | string, str: string) => void;
}

const ApiCallTagPicker: FC<ApiCallTagPickerProps> = ({
  itemContent,
  handleValueReplace,
}) => {
  const [webkookStateBase64, webhookProps] = itemContent.trim().split(";");

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
      Buffer.from(webkookStateBase64, "base64").toString("utf8")
    );
  } catch {}

  const [webhookState, setWebhookState] =
    useState<WebhookState>(initialWebhookState);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

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
    handleValueReplace(
      `[{[${itemContent}]}]`,
      `[{[ ${Buffer.from(JSON.stringify(webhookState)).toString(
        "base64"
      )};${webhookProps} ]}]`
    );
  }, [webhookState]);

  return (
    <>
      <span className="h-full" onClick={() => setIsWebhookModalOpen(true)}>
        <Chip
          label={
            webhookState && webhookProps
              ? `${webhookState.method} ${webhookState.url} (${webhookProps})`
              : "specify the property here"
          }
          textClass="text-[20px]"
        />
      </span>
      <Modal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        panelClass="min-w-[90vw]"
      >
        <div className="py-[20px] px-[15px] outline-none max-h-[75vh] overflow-y-scroll">
          <div className="w-full flex justify-end items-center">
            <SlackTemplateHeader
              onPersonalizeClick={onPersonalizeClick}
              onAddTemplateClick={onAddTemplateClick}
            />
          </div>
          <WebhookSettings
            webhookState={webhookState}
            setWebhookState={setWebhookState}
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
      </Modal>
    </>
  );
};

export default ApiCallTagPicker;
