import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { FC, useEffect, useState } from "react";
import {
  setSettingsPrivateApiKey,
  setDomainsList,
} from "reducers/settings.reducer";
import { useAppDispatch } from "store/hooks";
import { SendingServiceSettingsProps } from "../EmailSettings";

const MailgunSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  const dispatch = useAppDispatch();

  const [possibleDomains, setPossibleDomains] = useState<string[]>([]);

  const callDomains = async () => {
    if (formData.mailgunAPIKey) {
      dispatch(setSettingsPrivateApiKey(formData.mailgunAPIKey));
      const response = await dispatch(setDomainsList(formData.mailgunAPIKey));
      if (response?.data) {
        setPossibleDomains(
          response?.data?.map((item: { name: string }) => item.name) || []
        );
      }
    }
  };

  useEffect(() => {
    callDomains();
  }, [formData.mailgunAPIKey]);

  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>Mailgun API Key</div>
        <Input
          id="mailgun-api-key-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.mailgunAPIKey}
          onChange={(value) =>
            setFormData({ ...formData, mailgunAPIKey: value })
          }
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

      <div className="flex flex-col gap-[5px]">
        <div>Sending name</div>
        <Input
          id="mailgun-sending-name-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendingName}
          onChange={(value) => setFormData({ ...formData, sendingName: value })}
          placeholder="Display name"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Sending email</div>
        <Input
          id="mailgun-sending-email-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendingEmail}
          onChange={(value) =>
            setFormData({ ...formData, sendingEmail: value })
          }
          placeholder="sender@example.com"
        />
      </div>
    </>
  );
};

export default MailgunSettings;
