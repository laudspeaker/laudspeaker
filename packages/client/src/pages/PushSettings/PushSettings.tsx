import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Chip from "components/Elements/Chip";
import { PushPlatforms } from "pages/PushBuilder/PushBuilderContent";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PushSettingsAddUsers from "./PushSettingsAddUsers";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import PushSettingsFirebaseConfiguration from "./PushSettingsFirebaseConfiguration";
import Input from "components/Elements/Inputv2";
import ApiService from "services/api.service";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import CheckBox from "components/Checkbox/Checkbox";
import Account from "types/Account";
import MapValidationErrors from "pages/PeopleImport/Modals/MapValidationErrors";

export type ConnectedPushFirebasePlatforms = Record<
  PushPlatforms,
  | {
      fileName: string;
      isTrackingDisabled: boolean;
    }
  | undefined
>;

const platformIcons = {
  [PushPlatforms.ANDROID]: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
    >
      <rect width="40" height="40" rx="2" fill="#F3F4F6" />
      <path
        d="M24.8066 22.4184C24.3474 22.4184 23.9739 22.0446 23.9739 21.5854C23.9739 21.1262 24.3474 20.7527 24.8066 20.7527C25.2659 20.7527 25.6394 21.1262 25.6394 21.5854C25.6394 22.0446 25.2659 22.4184 24.8066 22.4184ZM15.6016 22.4184C15.1423 22.4184 14.7688 22.0446 14.7688 21.5854C14.7688 21.1262 15.1423 20.7527 15.6016 20.7527C16.0608 20.7527 16.4343 21.1262 16.4343 21.5854C16.4343 22.0446 16.0608 22.4184 15.6016 22.4184ZM25.1053 17.4019L26.7698 14.5193C26.8652 14.3536 26.8084 14.142 26.643 14.0463C26.4776 13.9509 26.2657 14.0077 26.17 14.1731L24.4847 17.0922C23.196 16.504 21.7486 16.1764 20.2041 16.1764C18.6596 16.1764 17.2122 16.504 15.9235 17.0922L14.2382 14.1731C14.1425 14.0077 13.9306 13.9509 13.7652 14.0463C13.5998 14.142 13.5428 14.3536 13.6384 14.5193L15.3029 17.4019C12.4448 18.9563 10.4901 21.8498 10.2041 25.2681H30.2041C29.9179 21.8498 27.9631 18.9563 25.1053 17.4019Z"
        fill="#3DDB85"
      />
    </svg>
  ),
  [PushPlatforms.IOS]: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
    >
      <rect width="40" height="40" rx="2" fill="#F3F4F6" />
      <path
        d="M23.2095 13.2071C23.8993 12.3443 24.3674 11.1858 24.244 10.002C23.2341 10.0522 22.0019 10.6682 21.2884 11.5317C20.6479 12.2711 20.0809 13.4781 20.2287 14.6124C21.3623 14.7107 22.4948 14.0458 23.2095 13.2071Z"
        fill="black"
      />
      <path
        d="M24.2311 14.8337C22.5849 14.7357 21.1852 15.768 20.3991 15.768C19.6125 15.768 18.4086 14.8831 17.1066 14.907C15.4119 14.9319 13.8394 15.8901 12.9794 17.4141C11.2105 20.4628 12.5126 24.9851 14.2327 27.4681C15.068 28.6966 16.0747 30.0492 17.4012 30.0006C18.6546 29.9514 19.1458 29.189 20.6693 29.189C22.1916 29.189 22.6341 30.0006 23.9609 29.976C25.3367 29.9514 26.1968 28.747 27.0322 27.5173C27.9904 26.117 28.3827 24.7648 28.4074 24.6906C28.3827 24.666 25.7544 23.6577 25.73 20.6343C25.7052 18.1028 27.7936 16.8987 27.8918 16.824C26.7125 15.0798 24.8699 14.8831 24.2311 14.8337Z"
        fill="black"
      />
    </svg>
  ),
};

const setupTabs = [
  { title: "Platform selection" },
  { title: "Firebase Configuration" },
  { title: "Add your users" },
];

export interface PushSettingsConfiguration {
  configFile: Record<
    PushPlatforms,
    | {
        fileName: string;
        credentials: JSON;
      }
    | undefined
  >;
  isTrackingDisabled: boolean;
  selectedPlatforms: Record<PushPlatforms, boolean>;
  connectedPlatforms: ConnectedPushFirebasePlatforms;
}

const PushSettings = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [disconnectPlarform, setDisconnectPlarform] = useState<PushPlatforms>();
  const [config, setConfig] = useState<PushSettingsConfiguration>({
    configFile: {
      Android: undefined,
      iOS: undefined,
    },
    isTrackingDisabled: true,
    selectedPlatforms: {
      Android: false,
      iOS: false,
    },
    connectedPlatforms: {
      Android: undefined,
      iOS: undefined,
    },
  });
  const [testToken, setTestToken] = useState("");
  const [viewConnected, setViewConnected] = useState<PushPlatforms>();

  const handleUpdateConfig = (values: Partial<PushSettingsConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...values }));
  };

  const handleCancelBack = () => {
    if (tabIndex === 0) navigate("/settings");
    else setTabIndex((prev) => prev - 1);
  };

  const clarifyData = async () => {
    setIsLoadingSettings(true);
    try {
      const { data } = await ApiService.get<Account>({ url: "/accounts" });
      const { pushPlatforms } = data.workspace;

      handleUpdateConfig({
        connectedPlatforms: {
          iOS: pushPlatforms?.iOS,
          Android: pushPlatforms?.Android,
        },
      });
    } catch (error) {}
    setIsLoadingSettings(false);
  };

  const handleDisconnectFirebase = async () => {
    setIsSaving(true);
    setDisconnectPlarform(undefined);
    try {
      await ApiService.delete({
        url: "organizations/disconnect-push-chanel",
        options: {
          data: {
            platform: disconnectPlarform,
          },
        },
      });
      setViewConnected(undefined);
      clarifyData();
    } catch (error) {
      toast.error(`Error disconnecting ${disconnectPlarform} platform`);
    }
    setIsSaving(false);
  };

  useEffect(() => {
    clarifyData();
  }, []);

  const tabs: Record<number, React.ReactElement> = {
    1: (
      <PushSettingsFirebaseConfiguration
        config={config}
        updateConfig={handleUpdateConfig}
      />
    ),
    2: (
      <PushSettingsAddUsers config={config} updateConfig={handleUpdateConfig} />
    ),
  };

  const handleSave = async () => {
    if (
      tabIndex === 2 &&
      (config.configFile.Android || config.configFile.iOS)
    ) {
      setIsSaving(true);
      try {
        const object: Record<string, any> = {};

        Object.keys(config.selectedPlatforms).forEach((el) => {
          if (config.selectedPlatforms[el as PushPlatforms]) {
            object[el] = {
              ...config.configFile[el as PushPlatforms],
              isTrackingDisabled: config.isTrackingDisabled,
            };
          }
        });

        await ApiService.patch({
          url: "/accounts",
          options: {
            pushPlatforms: object,
          },
        });
        await clarifyData();
        handleUpdateConfig({
          configFile: {
            Android: undefined,
            iOS: undefined,
          },
          selectedPlatforms: {
            Android: false,
            iOS: false,
          },
          isTrackingDisabled: true,
        });
      } catch (err) {
        toast.error("Error saving credentials, please try again.");
      } finally {
        setIsSaving(false);
      }
    }
    setTabIndex((prev) => (prev < setupTabs.length - 1 ? prev + 1 : 0));
  };

  const handleTest = async () => {
    setIsTestLoading(true);
    try {
      await ApiService.post({
        url: "/events/sendTestPush",
        options: { token: testToken },
      });
    } catch (error) {
      if (error instanceof AxiosError)
        toast.error(error.response?.data?.message);
      else toast.error("Unhandled request error");
    }
    setIsTestLoading(false);
  };

  const isPlatformSelected =
    config.selectedPlatforms.Android || config.selectedPlatforms.iOS;
  const isSomeConnected = Object.values(config.connectedPlatforms).some(
    (el) => !!el
  );
  const isBothConnected = Object.values(config.connectedPlatforms).every(
    (el) => !!el
  );

  return (
    <div className="p-5 flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <MapValidationErrors
        title="Confirm platform disconnection?"
        desc="This action can't be undo, and you will have to add credantials once more."
        confirmButtonType={ButtonType.DANGEROUS}
        confirmTextClassName="!bg-[#F43F5E]  hover:!bg-[#FB7185] !text-white transition-all"
        confirmText="Disconnect"
        cancelText="Cancel"
        isOpen={!!disconnectPlarform}
        onClose={() => setDisconnectPlarform(undefined)}
        onConfirm={handleDisconnectFirebase}
      />
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="flex gap-[15px] items-center">
          <BackButton
            onClick={() =>
              viewConnected
                ? setViewConnected(undefined)
                : navigate("/settings")
            }
          />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            {viewConnected} Push
          </div>
        </div>
        <div className="bg-white p-5 flex flex-col gap-5">
          {viewConnected ? (
            <>
              <div className="flex w-full justify-between items-center">
                <div className="font-inter text-[#111827] text-base font-semibold">
                  Server key (.JSON)
                </div>
              </div>
              <div className="w-full flex text-[#6366F1] p-[10px] border font-semibold border-[#E5E7EB] bg-[#F9FAFB] ">
                <div className="whitespace-nowrap overflow-hidden max-w-full text-ellipsis text-sm font-inter">
                  {config.connectedPlatforms[viewConnected]?.fileName ||
                    "Unknown name"}
                </div>
              </div>
              <div className=" font-inter text-[#111827] text-sm font-semibold">
                URL
              </div>
              <div className="w-full flex text-[#111827] px-3 py-[5px] border border-[#E5E7EB] bg-[#F9FAFB] ">
                <div className="whitespace-nowrap overflow-hidden max-w-full text-ellipsis text-sm font-inter">
                  exampleurl.com
                </div>
              </div>
              <CheckBox
                text={"Uninstall tracking for this app"}
                initValue={
                  config.connectedPlatforms[viewConnected]?.isTrackingDisabled
                }
                propControl={true}
                className="grayscale opacity-70"
                onCheck={() => {}}
              />
            </>
          ) : (
            <>
              {isPlatformSelected && (
                <>
                  <div className="flex justify-center items-center gap-4">
                    {setupTabs.map((el, i) => (
                      <div key={i} className="flex items-center">
                        <div
                          className={`text-base font-roboto flex justify-center transition-all items-center min-w-[24px] max-w-[24px] min-h-[24px] max-h-6 rounded-full border ${
                            i == tabIndex
                              ? "bg-[#6366F1] border-[#6366F1] text-white"
                              : i < tabIndex
                              ? "bg-[#22C55E] border-[#22C55E]"
                              : "bg-transparent border-[#9CA3AF] text-[#9CA3AF]"
                          }`}
                        >
                          {i < tabIndex ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="13"
                              viewBox="0 0 12 13"
                              fill="none"
                            >
                              <path
                                d="M11.3578 2.52051H10.4216C10.2904 2.52051 10.1658 2.58078 10.0855 2.6839L4.56358 9.67899L1.91581 6.32408C1.87576 6.27323 1.82471 6.23211 1.76648 6.20381C1.70826 6.17551 1.64439 6.16077 1.57965 6.16069H0.643492C0.55376 6.16069 0.504207 6.26381 0.559117 6.33345L4.22742 10.9808C4.39885 11.1977 4.72831 11.1977 4.90108 10.9808L11.4422 2.69194C11.4971 2.62363 11.4475 2.52051 11.3578 2.52051Z"
                                fill="white"
                              />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <div
                          className={`${
                            i == tabIndex
                              ? "text-base text-[#111827] font-semibold"
                              : i < tabIndex
                              ? "text-sm text-[#111827]"
                              : "text-sm text-[#9CA3AF]"
                          } mx-2 whitespace-nowrap font-inter transition-all`}
                        >
                          {el.title}
                        </div>
                        {setupTabs.length - 1 !== i && (
                          <div
                            className={`${
                              i < tabIndex
                                ? "border-[#22C55E]"
                                : "border-[#E5E7EB]"
                            } ml-2 border-t w-[124px] transition-all`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <hr className="border-[#E5E7EB] mb-5" />
                  {tabIndex === 0 && (
                    <div className="mb-[-10px] font-inter text-[#111827] text-base font-semibold">
                      Platform selection
                    </div>
                  )}
                </>
              )}
              {tabIndex === 0 ? (
                <>
                  <div className="text-[#9c9fa3] font-roboto text-[14px] leading-[22px]">
                    Set Up Push Notifications on the following platforms
                    <a
                      href="https://laudspeaker.com/docs/overview/introduction"
                      target="_blank"
                    >
                      <span className="inline-block ml-1 text-roboto text-[#111827] font-bold underline">
                        Documentation
                      </span>
                    </a>
                  </div>
                  <hr className="border-[#E5E7EB]" />
                  {isSomeConnected && !isPlatformSelected && (
                    <>
                      <div className="font-inter text-[#111827] text-base font-semibold">
                        Connected platforms
                      </div>
                      {Object.keys(config.connectedPlatforms)
                        .filter(
                          (el) =>
                            !!config.connectedPlatforms[el as PushPlatforms]
                        )
                        .map((el) => (
                          <div
                            key={el}
                            className="rounded border-[#E5E7EB] border px-5 py-6 flex items-center justify-between cursor-pointer select-none"
                            onClick={() => {
                              setViewConnected(el as PushPlatforms);
                            }}
                          >
                            <div className="flex items-center [&>svg]:mr-[10px] [&>svg]:max-w-[30px] [&>svg]:min-w-[30px] [&>svg]:min-h-[30px] [&>svg]:max-h-[30px]">
                              {platformIcons[el as PushPlatforms]}
                              <span className="text-[#18181B] text-base font-inter">
                                {el}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Chip
                                label="Connected"
                                wrapperClass="!bg-[#DCFCE7] !py-[2px] mr-[10px]"
                                textClass="!text-sm !font-inter !font-normal !text-[#14532D]"
                              />
                              <ArrowRightIcon className="min-w-[24px] min-h-[24px] text-[#111827]" />
                            </div>
                          </div>
                        ))}
                      <div className="font-inter text-[#111827] text-sm font-semibold">
                        Send a test push
                      </div>
                      <div className="text-xs font-inter text-[#4B5563] -my-[10px]">
                        Enter a device token for a test push. If you receive it,
                        the setup is successful. Find the token in your app or
                        notification service settings.
                      </div>
                      <div className="flex">
                        <Input
                          value={testToken}
                          onChange={setTestToken}
                          wrapperClassName="max-w-[220px] w-full mr-[10px]"
                          className="w-full max-w-[220px]"
                        />
                        <Button
                          type={ButtonType.SECONDARY}
                          disabled={!testToken || isTestLoading}
                          onClick={handleTest}
                        >
                          Send test
                        </Button>
                      </div>
                      {!isBothConnected && <hr className="border-[#E5E7EB]" />}
                    </>
                  )}
                  {!isBothConnected && !isPlatformSelected && (
                    <div className="font-inter text-[#111827] text-base font-semibold">
                      Supported platforms
                    </div>
                  )}
                  {!isBothConnected && (
                    <div className="flex gap-5 h-[66px] items-center">
                      {Object.values(PushPlatforms)
                        .filter((el) => !config.connectedPlatforms[el])
                        .map((el, i) => (
                          <div
                            key={el}
                            className={`${
                              config.selectedPlatforms[el] &&
                              "!bg-[#EEF2FF] !border-[#6366F1] border-2"
                            } w-[200px] px-5 bg-white py-[10px] rounded-[6px] border-[#D1D5DB] border flex items-center cursor-pointer select-none transition-all`}
                            onClick={() => {
                              handleUpdateConfig({
                                selectedPlatforms: {
                                  ...config.selectedPlatforms,
                                  [el]: !config.selectedPlatforms[el],
                                },
                              });
                            }}
                          >
                            {platformIcons[el]}
                            <div className="ml-[10px] font-inter text-base text-[#18181B]">
                              {el}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                tabs[tabIndex]
              )}

              {isPlatformSelected && (
                <>
                  <hr className="border-[#E5E7EB] mt-[20px]" />
                  <div className="flex justify-end gap-[10px]">
                    <Button
                      type={ButtonType.SECONDARY}
                      className="text-[#6366F1] border-[#6366F1]"
                      disabled={
                        (tabIndex == 2 && isSaving) || isLoadingSettings
                      }
                      onClick={handleCancelBack}
                    >
                      {tabIndex === 0 ? "Cancel" : "Back"}
                    </Button>
                    <Button
                      type={ButtonType.PRIMARY}
                      disabled={
                        (tabIndex == 1
                          ? !(
                              config.configFile.Android || config.configFile.iOS
                            )
                          : tabIndex == 2 && isSaving) || isLoadingSettings
                      }
                      onClick={handleSave}
                    >
                      {tabIndex === 2 ? "Save" : "Next"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {viewConnected && (
          <div>
            <Button
              type={ButtonType.DANGEROUS}
              onClick={() => {
                setDisconnectPlarform(viewConnected);
              }}
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { PushSettings };
