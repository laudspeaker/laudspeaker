import BackButton from "components/BackButton";
import CopyButton from "components/CopyButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import SnippetPicker from "components/SnippetPicker/SnippetPicker";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import Account from "types/Account";

const CustomModalSettings = () => {
  const navigate = useNavigate();

  const [APIKey, setAPIKey] = useState("");
  const [FirstName, setFirstName] = useState("");
  const [LastName, setLastName] = useState("");
  const [Email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      try {
        const {
          data: { workspace, firstName, lastName, email },
        } = await ApiService.get<Account>({ url: "/accounts" });

        setAPIKey(workspace?.apiKey);
        setFirstName(firstName || "");
        setLastName(lastName || "");
        setEmail(email);
        setIsConnected(workspace?.javascriptSnippetSetupped);
      } catch (e) {
        toast.error("Error while loading data");
      } finally {
        setIsLoading(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (isConnected) navigate("/settings");
  }, [isConnected]);

  return (
    <div className="p-5 flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Onboarding Suite
          </div>
        </div>

        <div className="bg-white p-5 flex flex-col gap-5">
          <div className="text-[#4B5563]">
            Laudspeaker allows you to create custom product onboarding flows{" "}
            <button className="text-[#111827] font-bold underline">
              Documentation
            </button>
          </div>

          <div className="flex items-center gap-[10px]">
            <div className="max-w-[100px] w-full text-[#18181B]">API Key</div>
            <div className="w-full px-[12px] py-[4px] rounded-sm border border-[#E5E7EB] bg-[#F3F4F6] font-roboto flex justify-between items-center">
              <div>{APIKey}</div>
              <CopyButton
                onClick={() => navigator.clipboard.writeText(APIKey)}
              />
            </div>
          </div>

          <div>
            <SnippetPicker
              userApiKey={APIKey}
              firstName={FirstName}
              lastName={LastName}
              email={Email}
            />
          </div>
        </div>

        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {}}
          className="w-fit"
          disabled
        >
          Connecting...
        </Button>
      </div>
    </div>
  );
};

export default CustomModalSettings;
