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
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col gap-[5px] w-full">
            <div>Sending email</div>
            <Input
              id="mailgun-sending-email"
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
            sendingOptions: [...formData.sendingOptions, { sendingEmail: "" }],
          })
        }
      >
        Add sending option
      </Button>
    </>
  );
};

export default SendgridSettings;
