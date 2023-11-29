import React from "react";
import CheckBox from "components/Checkbox/Checkbox";
import PlatformSettingsComponents from "./PlatformSettingsComponents";
import AndroidOnlySettings from "./AndroidOnlySettings";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import TrashIcon from "pages/Personv2/icons/TrashIcon";
import PushBuilderPreviewer from "./PushBuilderPreviewer";

export enum PushPlatforms {
  IOS = "iOS",
  ANDROID = "Android",
}

export enum PushClickBehavior {
  OPEN_APP = "OPEN_APP",
  REDIRECT_URL = "REDIRECT_URL",
}

export interface PlatformSettings {
  title: string;
  description: string;
  image?: { key: string; imageSrc: string };
  clickBehavior: {
    type: PushClickBehavior;
    webURL: string;
  };
  summary: string;
  expandedImage?: { key: string; imageSrc: string };
}

export interface PushBuilderData {
  platform: Record<PushPlatforms, boolean>;
  keepContentConsistent: boolean;
  settings: Record<PushPlatforms, PlatformSettings>;
  fields: {
    key: string;
    value: string;
  }[];
}

export interface PushBuilderContentProps {
  data: PushBuilderData;
  onChange: (data: PushBuilderData) => void;
}

export const defaultPlatformSettings: PlatformSettings = {
  title: "",
  description: "",
  image: undefined,
  clickBehavior: {
    type: PushClickBehavior.OPEN_APP,
    webURL: "",
  },
  summary: "",
  expandedImage: undefined,
};

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
        fill="#111827"
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

const PushBuilderContent = ({ data, onChange }: PushBuilderContentProps) => {
  const handleChangeData =
    (platforms: PushPlatforms[]) => (settings: PlatformSettings) => {
      const newData = { ...data };
      platforms.forEach((el) => {
        newData.settings[el] = {
          ...settings,
          title: settings.title.slice(0, 65),
          description: settings.description.slice(
            0,
            el === PushPlatforms.IOS ? 178 : 240
          ),
        };
      });

      onChange(newData);
    };

  const handleUpdateConsistent = (checked: boolean) => {
    const isNotConsistent =
      Object.values(data.platform).filter((el) => el).length === 1;

    onChange({
      ...data,
      keepContentConsistent: isNotConsistent ? false : checked,
      ...(isNotConsistent
        ? {}
        : {
            settings: {
              [PushPlatforms.ANDROID]: data.settings[PushPlatforms.IOS],
              [PushPlatforms.IOS]: data.settings[PushPlatforms.IOS],
            },
          }),
    });
  };

  const handleFieldChange = (key: string, value: string, i: number) => {
    data.fields[i].key = key;
    data.fields[i].value = value;
    onChange({ ...data });
  };

  const handleFieldDelete = (i: number) => {
    const newFields = [...data.fields];
    newFields.splice(i, 1);
    onChange({ ...data, fields: newFields });
  };

  const isFewConnected =
    Object.values(data.platform).filter((pl) => pl).length > 1;

  return (
    <div className="max-h-[calc(100vh-106px)] h-full flex">
      <div className="h-full min-w-[420px] bg-[#F3F4F6]">
        <div className="font-inter text-[16px] font-semibold pt-[20px] px-[20px] leading-[24px]">
          Preview
        </div>
        <PushBuilderPreviewer data={data} />
      </div>
      <div className="h-full w-full bg-white py-[20px] overflow-y-scroll">
        <div className="px-[20px]">
          <div className="font-inter text-[16px] font-semibold leading-[24px] mb-[10px]">
            Platform
          </div>
          <div className="flex gap-[20px]">
            {Object.values(PushPlatforms).map((el, i) => (
              <div
                key={el}
                className={`${
                  data.platform[el] ? "bg-[#EEF2FF] !border-[#6366F1]" : ""
                } w-[200px] px-[20px] py-[10px] rounded border-[#E5E7EB] border-[2px] flex items-center cursor-pointer select-none transition-all`}
                onClick={() => {
                  const newData = {
                    ...data,
                    platform: {
                      ...data.platform,
                      [el]: !data.platform[el],
                    },
                  };

                  if (
                    Object.values(newData.platform).filter((pl) => pl)
                      .length === 0
                  )
                    return;

                  if (
                    Object.values(newData.platform).filter((pl) => pl)
                      .length === 1
                  )
                    newData.keepContentConsistent = false;

                  onChange(newData);
                }}
              >
                {platformIcons[el]}
                <div className="ml-[10px] font-inter text-[16px] font-semibold text-[#111827] leading-[24px]">
                  {el}
                </div>
              </div>
            ))}
          </div>
        </div>
        <hr className="border-[#E5E7EB] my-[20px]" />
        <div className="px-[20px]">
          <div className="font-inter text-[16px] font-semibold leading-[24px] mb-[10px]">
            General
          </div>
          {isFewConnected && (
            <CheckBox
              text={"Keep iOS and Android content consistent"}
              initValue={data.keepContentConsistent}
              propControl={true}
              onCheck={handleUpdateConsistent}
            />
          )}
        </div>
        {data.keepContentConsistent ? (
          <>
            <div className="px-[20px]">
              <PlatformSettingsComponents
                data={data.settings[PushPlatforms.IOS]}
                onChange={handleChangeData([
                  PushPlatforms.ANDROID,
                  PushPlatforms.IOS,
                ])}
              />
            </div>
            <hr className="border-[#E5E7EB] my-[20px]" />
            {data.platform[PushPlatforms.ANDROID] && (
              <>
                <div className="px-[20px]">
                  <div className="font-inter text-[16px] font-semibold leading-[24px] mb-[10px]">
                    Android only
                  </div>
                  <AndroidOnlySettings
                    data={data.settings[PushPlatforms.ANDROID]}
                    onChange={handleChangeData([PushPlatforms.ANDROID])}
                  />
                </div>
                <hr className="border-[#E5E7EB] my-[20px]" />
              </>
            )}
          </>
        ) : (
          <>
            {Object.values(PushPlatforms).map((el, i) => (
              <React.Fragment key={el}>
                {data.platform[el] ? (
                  <>
                    <div className="px-[20px] mt-[20px]">
                      {isFewConnected && (
                        <div className="h-8 p-[5px] bg-gray-100 rounded-sm justify-start items-start gap-2.5 inline-flex">
                          <div className="text-gray-900 text-sm font-semibold font-inter leading-snug">
                            {el} settings
                          </div>
                        </div>
                      )}
                      <PlatformSettingsComponents
                        data={data.settings[el]}
                        onChange={handleChangeData([el])}
                      />
                    </div>
                    {el === PushPlatforms.ANDROID && (
                      <div className="px-[20px]">
                        <AndroidOnlySettings
                          data={data.settings[el]}
                          onChange={handleChangeData([el])}
                        />
                      </div>
                    )}
                    <hr className="border-[#E5E7EB] my-[20px]" />
                  </>
                ) : (
                  <></>
                )}
              </React.Fragment>
            ))}
          </>
        )}
        <div className="px-[20px]">
          <div className="font-inter text-[16px] font-semibold leading-[24px] mb-[10px]">
            Key value pairs
          </div>
          <div className="font-inter text-[12px] text-[#000000D9] leading-[22px] my-[10px]">
            description description description description description
          </div>
          {data.fields.map((el, i) => (
            <div
              key={i}
              className="w-full p-[10px] rounded bg-[#F3F4F6] flex items-center justify-between mb-[5px]"
            >
              <div className="flex">
                <Input
                  placeholder="key"
                  value={el.key}
                  wrapperClassName="!w-[200px] mr-[10px]"
                  className="!w-full !rounded-[2px]"
                  onChange={(val) => {
                    handleFieldChange(val, el.value, i);
                  }}
                />
                <Input
                  placeholder="value"
                  value={el.value}
                  wrapperClassName="!w-[200px]"
                  className="!w-full !rounded-[2px]"
                  onChange={(val) => {
                    handleFieldChange(el.key, val, i);
                  }}
                />
              </div>
              <div
                className="inline-block cursor-pointer h-full px-[4px]"
                onClick={() => handleFieldDelete(i)}
              >
                <TrashIcon />
              </div>
            </div>
          ))}
          <Button
            type={ButtonType.SECONDARY}
            onClick={() => {
              onChange({
                ...data,
                fields: [...data.fields, { key: "", value: "" }],
              });
            }}
          >
            Add field
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PushBuilderContent;
