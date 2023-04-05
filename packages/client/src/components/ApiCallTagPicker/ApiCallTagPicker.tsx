import Chip from "components/Elements/Chip";
import React, { FC, useEffect, useState } from "react";
import { Buffer } from "buffer";
import WebhookSettings, {
  FallBackAction,
  WebhookMethod,
  WebhookState,
} from "pages/WebhookBuilder/WebhookSettings";
import Modal from "components/Elements/Modal";

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
          <WebhookSettings
            webhookState={webhookState}
            setWebhookState={setWebhookState}
          />
        </div>
      </Modal>
    </>
  );
};

export default ApiCallTagPicker;
