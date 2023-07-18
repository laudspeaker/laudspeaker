import BackButton from "components/BackButton";
import CopyButton from "components/CopyButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import SnippetPicker from "components/SnippetPicker/SnippetPicker";
import React, { useState } from "react";

const JavascriptSnippetSettings = () => {
  const [APIKey, setAPIKey] = useState("");

  return (
    <div className="p-[20px] flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-[20px]">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Javascript snippet
          </div>
        </div>

        <div className="bg-white p-[20px] flex flex-col gap-[20px]">
          <div className="text-[#4B5563]">
            Description Description Description Description Description
            Description Description Description Description Description
            Description Description Description Description{" "}
            <button className="text-[#111827] font-bold underline">
              Documentation
            </button>
          </div>

          <div className="flex items-center gap-[10px]">
            <div className="max-w-[100px] w-full text-[#18181B]">
              Copy API Key
            </div>
            <div className="w-full px-[12px] py-[4px] rounded-[2px] border-[1px] border-[#E5E7EB] bg-[#F3F4F6] font-roboto flex justify-between items-center">
              <div>{APIKey}</div>
              <CopyButton
                onClick={() => navigator.clipboard.writeText(APIKey)}
              />
            </div>
          </div>

          <div>
            <SnippetPicker userApiKey={APIKey} />
          </div>
        </div>

        <Button
          type={ButtonType.PRIMARY}
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

export default JavascriptSnippetSettings;
