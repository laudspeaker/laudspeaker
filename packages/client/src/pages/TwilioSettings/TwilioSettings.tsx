import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import React, { useState } from "react";

interface TwilioFormData {
  smsAccountSid: string;
  smsAuthToken: string;
  smsFrom: string;
}

const TwilioSettings = () => {
  const [formData, setFormData] = useState<TwilioFormData>({
    smsAccountSid: "",
    smsAuthToken: "",
    smsFrom: "",
  });

  return (
    <div className="p-[20px] flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-[20px]">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Twilio SMS
          </div>
        </div>

        <div className="bg-white p-[20px] flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[5px]">
            <div>Twilio account SID</div>
            <Input
              wrapperClassName="!w-full"
              className="w-full"
              value={formData.smsAccountSid}
              onChange={(value) =>
                setFormData({ ...formData, smsAccountSid: value })
              }
              placeholder="Key number"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <div>Twilio auth token</div>
            <Input
              wrapperClassName="!w-full"
              className="w-full"
              value={formData.smsAuthToken}
              onChange={(value) =>
                setFormData({ ...formData, smsAuthToken: value })
              }
              placeholder="Email domain"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <div>SMS from</div>
            <Input
              wrapperClassName="!w-full"
              className="w-full"
              value={formData.smsFrom}
              onChange={(value) => setFormData({ ...formData, smsFrom: value })}
              placeholder="Select sending number"
            />
          </div>
        </div>

        <Button
          type={ButtonType.SECONDARY}
          onClick={() => {}}
          className="w-fit"
          disabled
        >
          Connect
        </Button>
      </div>
    </div>
  );
};

export default TwilioSettings;
