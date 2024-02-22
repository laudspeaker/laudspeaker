import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { FC, useEffect, useState } from "react";
import {
  setSettingsPrivateApiKey,
  setDomainsList,
} from "reducers/settings.reducer";
import { useAppDispatch } from "store/hooks";
import { SendingServiceSettingsProps } from "../EmailSettings";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import TrashIcon from "assets/icons/TrashIcon";

const MailgunSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  const dispatch = useAppDispatch();

  const [possibleDomains, setPossibleDomains] = useState<string[]>([]);

  const callDomains = async () => {
    if (formData.apiKey) {
      dispatch(setSettingsPrivateApiKey(formData.apiKey));
      const response = await dispatch(setDomainsList(formData.apiKey));
      if (response?.data) {
        setPossibleDomains(
          response?.data?.map((item: { name: string }) => item.name) || []
        );
      }
    }
  };

  useEffect(() => {
    callDomains();
  }, [formData.apiKey]);

  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>Mailgun API Key</div>
        <Input
          id="mailgun-api-key-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.apiKey}
          onChange={(value) => setFormData({ ...formData, apiKey: value })}
          type="password"
          placeholder="Key number"
        />
      </div>
      <div className="flex flex-col gap-[5px]">
        <div>Domain</div>
        <Select
          id="mailgun-domain-select"
          options={possibleDomains.map((domain) => ({
            key: domain,
            title: domain,
          }))}
          value={formData.sendingDomain}
          onChange={(value) =>
            setFormData({ ...formData, sendingDomain: value })
          }
          placeholder="Email domain"
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

          <div className="flex flex-col gap-[5px] w-full">
            <div>Sending name</div>
            <Input
              id="mailgun-sending-email"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.sendingName || ""}
              onChange={(value) => {
                formData.sendingOptions[i].sendingName = value;
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
            sendingOptions: [
              ...formData.sendingOptions,
              { sendingEmail: "", sendingName: "" },
            ],
          })
        }
      >
        Add sending option
      </Button>
    </>
  );
};

export default MailgunSettings;
