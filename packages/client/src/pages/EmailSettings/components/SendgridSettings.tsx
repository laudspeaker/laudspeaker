import Input from "components/Elements/Inputv2";
import React, { FC } from "react";
import { SendingServiceSettingsProps } from "../EmailSettings";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import TrashIcon from "assets/icons/TrashIcon";

const SendgridSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>SendGrid API Key</div>
        <Input
          id="sendgrid-api-key-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.apiKey}
          onChange={(value) => setFormData({ ...formData, apiKey: value })}
          type="password"
          placeholder="Key number"
        />
      </div>

      {formData.sendingOptions.length !== 0 && (
        <div className="h-[1px] w-full bg-black" />
      )}

      {formData.sendingOptions.map((option, i) => (
        <div className="flex items-center gap-2.5" key={`sending-${i}`}>
          <div className="flex flex-col gap-[5px] w-full">
            <div>Sending email</div>
            <Input
              id="sendgrid-sending-email"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.sendingEmail}
              onChange={(value) => {
                formData.sendingOptions[i].sendingEmail = value;
                setFormData({ ...formData });
              }}
              placeholder="Sending email"
            />
          </div>

          <div className="flex flex-col gap-[5px] w-full">
            <div>Sending name</div>
            <Input
              id="sendgrid-sending-name"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.sendingName || ""}
              onChange={(value) => {
                formData.sendingOptions[i].sendingName = value;
                setFormData({ ...formData });
              }}
              placeholder="Sending name"
            />
          </div>

          <div
            className="cursor-pointer"
            onClick={() => {
              formData.sendingOptions.splice(i, 1);
              setFormData({ ...formData });
            }}
          >
            <TrashIcon />
          </div>
        </div>
      ))}

      <Button
        type={ButtonType.SECONDARY}
        onClick={() =>
          setFormData({
            ...formData,
            sendingOptions: [
              ...formData.sendingOptions,
              { sendingEmail: "", sendingName: "" },
            ],
          })
        }
      >
        Add sending option
      </Button>

      {formData.replyToOptions && formData.replyToOptions.length !== 0 && (
        <div className="h-[1px] w-full bg-black" />
      )}

      {formData.replyToOptions?.map((option, i) => (
        <div className="flex items-center gap-2.5" key={`replyto-${i}`}>
          <div className="flex flex-col gap-[5px] w-full">
            <div>Reply-to email</div>
            <Input
              id="sendgrid-replyto-email"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.replyToEmail ?? ""}
              onChange={(value) => {
                if (formData.replyToOptions)
                  formData.replyToOptions[i].replyToEmail = value;
                setFormData({ ...formData });
              }}
              placeholder="Reply-to email"
            />
          </div>

          <div className="flex flex-col gap-[5px] w-full">
            <div>Reply-to name</div>
            <Input
              id="sendgrid-replyto-name"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.replyToName || ""}
              onChange={(value) => {
                if (formData.replyToOptions)
                  formData.replyToOptions[i].replyToName = value;
                setFormData({ ...formData });
              }}
              placeholder="Reply-to name"
            />
          </div>

          <div
            className="cursor-pointer"
            onClick={() => {
              formData.replyToOptions?.splice(i, 1);
              setFormData({ ...formData });
            }}
          >
            <TrashIcon />
          </div>
        </div>
      ))}

      <Button
        type={ButtonType.SECONDARY}
        onClick={() =>
          setFormData({
            ...formData,
            replyToOptions: [
              ...(formData.replyToOptions || []),
              { replyToEmail: "", replyToName: "" },
            ],
          })
        }
      >
        Add reply-to option
      </Button>
    </>
  );
};

export default SendgridSettings;
