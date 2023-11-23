import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2";
import { useEffect, useState } from "react";
import { PushBuilderData, PushPlatforms } from "./PushBuilderContent";

interface PushBuilderPreviewerProps {
  data: PushBuilderData;
}

enum PreviewOptions {
  LOCK = "LOCK",
  EXPANDED = "EXPANDED",
  BANER = "BANER",
}

const previewOptionsMap = (
  option: string | PreviewOptions,
  platform: PushPlatforms
) =>
  ({
    [PreviewOptions.LOCK]: "Lock screen",
    [PreviewOptions.EXPANDED]: "Expanded",
    [PreviewOptions.BANER]:
      platform === PushPlatforms.IOS ? "Banner (iOS)" : "Heads-up (Android)",
  }[option]);

const PushBuilderPreviewer = ({ data }: PushBuilderPreviewerProps) => {
  const [currentPreviewPlatform, setCurrentPreviewPlatform] = useState(
    PushPlatforms.IOS
  );
  const [currentPreviewMode, setCurrentPreviewMode] = useState(
    PreviewOptions.LOCK
  );

  useEffect(() => {
    if (!data.platform[currentPreviewPlatform]) {
      setCurrentPreviewPlatform(
        currentPreviewPlatform === PushPlatforms.ANDROID
          ? PushPlatforms.IOS
          : PushPlatforms.ANDROID
      );
    }
  }, [data]);

  return (
    <>
      <div className="flex  gap-[20px] mt-[15px]">
        <div className="flex">
          {Object.values(PushPlatforms).map((el, i) => (
            <Button
              className={`${
                currentPreviewPlatform !== el &&
                "!text-[#111827] !bg-white !border-white"
              } ${
                i == 0 ? "rounded-l-[2px]" : "rounded-r-[2px]"
              } rounded-none w-[80px] px-[10px] py-[2px] disabled:!bg-[#E5E7EB] disabled:!border-[#E5E7EB] disabled:!text-[#4B5563]`}
              key={el}
              type={ButtonType.PRIMARY}
              disabled={!data.platform[el]}
              onClick={() => {
                setCurrentPreviewPlatform(el);
              }}
            >
              {el}
            </Button>
          ))}
        </div>
        <Select
          value={currentPreviewMode}
          //   className="min-w-[200px]"
          options={Object.values(PreviewOptions).map((el) => ({
            key: el,
            title: previewOptionsMap(el, currentPreviewPlatform) as string,
          }))}
          onChange={(val) => setCurrentPreviewMode(val as PreviewOptions)}
        />
      </div>
      <div className="h-full max-h-[calc(100vh-212px)] overflow-y-auto"></div>
    </>
  );
};

export default PushBuilderPreviewer;
