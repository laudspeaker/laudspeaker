import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2";
import { useEffect, useState } from "react";
import { PushBuilderData, PushPlatforms } from "./PushBuilderContent";
import IOS_BG from "./assets/images/iosbg.jpg";
import IOS_BG_BANNER from "./assets/images/iosBaner.jpg";
import NO_APP_ICON from "./assets/images/noAppIcon.jpg";
import ANDROID_LOCK from "./assets/images/androidLock.jpg";
import ANDROID_UNLOCK from "./assets/images/androidUnclocked.jpg";

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
      <div className="flex gap-5 mt-[15px] px-5">
        <div className="flex ">
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
          options={Object.values(PreviewOptions).map((el) => ({
            key: el,
            title: previewOptionsMap(el, currentPreviewPlatform) as string,
          }))}
          onChange={(val) => setCurrentPreviewMode(val as PreviewOptions)}
        />
      </div>
      <div className="h-full max-h-[calc(100vh-227px)] overflow-y-auto mt-[15px]">
        <div className="px-5">
          <div className="relative min-w-[380px] max-w-[380px] min-h-[794px] max-h-[794px]">
            <img
              className={`${
                currentPreviewPlatform === PushPlatforms.IOS
                  ? "rounded-[44.3px]"
                  : "rounded-2xl"
              }  border-[7px] border-white min-w-[380px] max-w-[380px] min-h-[794px] max-h-[794px]`}
              src={
                currentPreviewPlatform === PushPlatforms.ANDROID
                  ? currentPreviewMode === PreviewOptions.BANER
                    ? ANDROID_UNLOCK
                    : ANDROID_LOCK
                  : currentPreviewMode === PreviewOptions.BANER
                  ? IOS_BG_BANNER
                  : IOS_BG
              }
              alt=""
            />
            {currentPreviewPlatform === PushPlatforms.IOS &&
              currentPreviewMode !== PreviewOptions.BANER && (
                <>
                  <div className="left-1/2 -translate-x-[48%] top-[73px] absolute w-[219.01px] h-6 backdrop-blur-[18.47px] flex-col justify-start items-center inline-flex">
                    <div className="self-stretch text-center text-white text-xl font-normal font-['PingFang SC']">
                      Sat 4 12:41 AM
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="161"
                    height="68"
                    viewBox="0 0 161 68"
                    fill="none"
                    className="absolute left-1/2 top-[111px] -translate-x-1/2"
                  >
                    <g filter="url(#filter0_b_77_11985)">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M39.3305 63.755C35.3235 66.4964 30.5123 67.8671 24.8968 67.8671C19.0361 67.8671 14.1133 66.4681 10.1285 63.67C6.14369 60.872 3.47338 57.1414 2.11758 52.4782C1.88622 51.7829 1.9318 51.2221 2.25432 50.7958C2.57685 50.3695 3.10039 50.1563 3.82495 50.1563H11.0857C11.8127 50.1563 12.3859 50.2963 12.8056 50.5763C13.2252 50.8563 13.6005 51.3066 13.9313 51.9272C14.9296 53.9816 16.3502 55.5886 18.193 56.7483C20.0358 57.908 22.3104 58.4878 25.0167 58.4878C28.6357 58.4878 31.5695 57.4242 33.8181 55.297C36.0668 53.1698 37.7302 50.2894 38.8085 46.6558C39.8569 43.1227 40.4152 39.1643 40.4834 34.7805C39.896 35.8554 39.1891 36.866 38.3629 37.8123C36.5549 39.8832 34.299 41.5031 31.5952 42.6722C28.8915 43.8413 25.8355 44.4258 22.4275 44.4258C18.1563 44.4258 14.3704 43.5081 11.0697 41.6726C7.76894 39.8371 5.18337 37.32 3.31295 34.1212C1.44253 30.9224 0.507324 27.2928 0.507324 23.2324C0.507324 18.8281 1.57607 14.9159 3.71355 11.4958C5.85103 8.07576 8.78376 5.39396 12.5117 3.45044C16.2397 1.50692 20.4795 0.535156 25.231 0.535156C30.1914 0.535156 34.5052 1.62542 38.1723 3.80595C41.8393 5.98649 44.7349 8.88356 46.8591 12.4972C48.5833 15.4052 49.8374 18.5911 50.6212 22.0548C51.405 25.5186 51.7969 29.3136 51.7969 33.4397C51.7969 40.6313 50.7209 46.7963 48.5689 51.9349C46.4169 57.0735 43.3374 61.0135 39.3305 63.755ZM18.4903 33.6636C20.4743 34.7495 22.7356 35.2925 25.2744 35.2925C27.7399 35.2925 29.9623 34.7495 31.9415 33.6636C33.9206 32.5777 35.4929 31.0984 36.6583 29.2258C37.8237 27.3533 38.4064 25.2368 38.4064 22.8766C38.4064 20.4135 37.8237 18.1945 36.6583 16.2195C35.4929 14.2445 33.9258 12.6884 31.9568 11.5513C29.9878 10.4141 27.7813 9.84557 25.3373 9.84557C22.8813 9.84557 20.6561 10.409 18.6617 11.5358C16.6673 12.6626 15.077 14.193 13.8909 16.1271C12.7048 18.0613 12.1118 20.2392 12.1118 22.661C12.1118 25.1034 12.6789 27.2763 13.8131 29.1797C14.9473 31.083 16.5063 32.5777 18.4903 33.6636Z"
                        fill="#999999"
                        fill-opacity="0.8"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M39.3305 63.755C35.3235 66.4964 30.5123 67.8671 24.8968 67.8671C19.0361 67.8671 14.1133 66.4681 10.1285 63.67C6.14369 60.872 3.47338 57.1414 2.11758 52.4782C1.88622 51.7829 1.9318 51.2221 2.25432 50.7958C2.57685 50.3695 3.10039 50.1563 3.82495 50.1563H11.0857C11.8127 50.1563 12.3859 50.2963 12.8056 50.5763C13.2252 50.8563 13.6005 51.3066 13.9313 51.9272C14.9296 53.9816 16.3502 55.5886 18.193 56.7483C20.0358 57.908 22.3104 58.4878 25.0167 58.4878C28.6357 58.4878 31.5695 57.4242 33.8181 55.297C36.0668 53.1698 37.7302 50.2894 38.8085 46.6558C39.8569 43.1227 40.4152 39.1643 40.4834 34.7805C39.896 35.8554 39.1891 36.866 38.3629 37.8123C36.5549 39.8832 34.299 41.5031 31.5952 42.6722C28.8915 43.8413 25.8355 44.4258 22.4275 44.4258C18.1563 44.4258 14.3704 43.5081 11.0697 41.6726C7.76894 39.8371 5.18337 37.32 3.31295 34.1212C1.44253 30.9224 0.507324 27.2928 0.507324 23.2324C0.507324 18.8281 1.57607 14.9159 3.71355 11.4958C5.85103 8.07576 8.78376 5.39396 12.5117 3.45044C16.2397 1.50692 20.4795 0.535156 25.231 0.535156C30.1914 0.535156 34.5052 1.62542 38.1723 3.80595C41.8393 5.98649 44.7349 8.88356 46.8591 12.4972C48.5833 15.4052 49.8374 18.5911 50.6212 22.0548C51.405 25.5186 51.7969 29.3136 51.7969 33.4397C51.7969 40.6313 50.7209 46.7963 48.5689 51.9349C46.4169 57.0735 43.3374 61.0135 39.3305 63.755ZM18.4903 33.6636C20.4743 34.7495 22.7356 35.2925 25.2744 35.2925C27.7399 35.2925 29.9623 34.7495 31.9415 33.6636C33.9206 32.5777 35.4929 31.0984 36.6583 29.2258C37.8237 27.3533 38.4064 25.2368 38.4064 22.8766C38.4064 20.4135 37.8237 18.1945 36.6583 16.2195C35.4929 14.2445 33.9258 12.6884 31.9568 11.5513C29.9878 10.4141 27.7813 9.84557 25.3373 9.84557C22.8813 9.84557 20.6561 10.409 18.6617 11.5358C16.6673 12.6626 15.077 14.193 13.8909 16.1271C12.7048 18.0613 12.1118 20.2392 12.1118 22.661C12.1118 25.1034 12.6789 27.2763 13.8131 29.1797C14.9473 31.083 16.5063 32.5777 18.4903 33.6636Z"
                        fill="#707070"
                        style={{
                          mixBlendMode: "color-dodge",
                        }}
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M69.6871 22.7532C68.4074 24.016 66.8536 24.6474 65.0255 24.6474C63.167 24.6474 61.5979 24.016 60.3183 22.7532C59.0387 21.4904 58.3989 19.9419 58.3989 18.1079C58.3989 16.3039 59.0387 14.7705 60.3183 13.5077C61.5979 12.2449 63.167 11.6135 65.0255 11.6135C66.8536 11.6135 68.4074 12.2449 69.6871 13.5077C70.9667 14.7705 71.6065 16.3039 71.6065 18.1079C71.6065 19.9419 70.9667 21.4904 69.6871 22.7532ZM69.6871 55.3153C68.4074 56.5781 66.8536 57.2095 65.0255 57.2095C63.167 57.2095 61.5979 56.5781 60.3183 55.3153C59.0387 54.0525 58.3989 52.5191 58.3989 50.7151C58.3989 48.9111 59.0387 47.3777 60.3183 46.1149C61.5979 44.8521 63.167 44.2207 65.0255 44.2207C66.8536 44.2207 68.4074 44.8521 69.6871 46.1149C70.9667 47.3777 71.6065 48.9111 71.6065 50.7151C71.6065 52.5191 70.9667 54.0525 69.6871 55.3153Z"
                        fill="#999999"
                        fill-opacity="0.8"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M69.6871 22.7532C68.4074 24.016 66.8536 24.6474 65.0255 24.6474C63.167 24.6474 61.5979 24.016 60.3183 22.7532C59.0387 21.4904 58.3989 19.9419 58.3989 18.1079C58.3989 16.3039 59.0387 14.7705 60.3183 13.5077C61.5979 12.2449 63.167 11.6135 65.0255 11.6135C66.8536 11.6135 68.4074 12.2449 69.6871 13.5077C70.9667 14.7705 71.6065 16.3039 71.6065 18.1079C71.6065 19.9419 70.9667 21.4904 69.6871 22.7532ZM69.6871 55.3153C68.4074 56.5781 66.8536 57.2095 65.0255 57.2095C63.167 57.2095 61.5979 56.5781 60.3183 55.3153C59.0387 54.0525 58.3989 52.5191 58.3989 50.7151C58.3989 48.9111 59.0387 47.3777 60.3183 46.1149C61.5979 44.8521 63.167 44.2207 65.0255 44.2207C66.8536 44.2207 68.4074 44.8521 69.6871 46.1149C70.9667 47.3777 71.6065 48.9111 71.6065 50.7151C71.6065 52.5191 70.9667 54.0525 69.6871 55.3153Z"
                        fill="#707070"
                        style={{
                          mixBlendMode: "color-dodge",
                        }}
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M119.516 66.7255H112.861C111.334 66.7255 110.571 65.972 110.571 64.4649V54.2138H79.9465C78.4189 54.2138 77.6551 53.4603 77.6551 51.9532V46.0416C77.6551 45.3773 77.7181 44.8091 77.8443 44.337C77.9704 43.8648 78.2244 43.3119 78.6062 42.6781C80.6009 39.267 82.7768 35.6289 85.134 31.764C87.4912 27.899 90.1817 23.6547 93.2056 19.031C96.2295 14.4073 99.7337 9.24246 103.718 3.53638C104.585 2.27641 105.672 1.64642 106.977 1.64642H119.516C121.043 1.64642 121.807 2.39996 121.807 3.90705V44.7647H128.374C129.901 44.7647 130.665 45.5183 130.665 47.0253V51.9532C130.665 53.4603 129.922 54.2138 128.436 54.2138H121.807V64.4649C121.807 65.972 121.043 66.7255 119.516 66.7255ZM94.5765 34.2767C92.3709 37.8069 90.2982 41.303 88.3583 44.7649H110.745V9.93577C107.461 14.6661 104.497 19.0229 101.852 23.0063C99.2072 26.9896 96.7821 30.7464 94.5765 34.2767Z"
                        fill="#999999"
                        fill-opacity="0.8"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M119.516 66.7255H112.861C111.334 66.7255 110.571 65.972 110.571 64.4649V54.2138H79.9465C78.4189 54.2138 77.6551 53.4603 77.6551 51.9532V46.0416C77.6551 45.3773 77.7181 44.8091 77.8443 44.337C77.9704 43.8648 78.2244 43.3119 78.6062 42.6781C80.6009 39.267 82.7768 35.6289 85.134 31.764C87.4912 27.899 90.1817 23.6547 93.2056 19.031C96.2295 14.4073 99.7337 9.24246 103.718 3.53638C104.585 2.27641 105.672 1.64642 106.977 1.64642H119.516C121.043 1.64642 121.807 2.39996 121.807 3.90705V44.7647H128.374C129.901 44.7647 130.665 45.5183 130.665 47.0253V51.9532C130.665 53.4603 129.922 54.2138 128.436 54.2138H121.807V64.4649C121.807 65.972 121.043 66.7255 119.516 66.7255ZM94.5765 34.2767C92.3709 37.8069 90.2982 41.303 88.3583 44.7649H110.745V9.93577C107.461 14.6661 104.497 19.0229 101.852 23.0063C99.2072 26.9896 96.7821 30.7464 94.5765 34.2767Z"
                        fill="#707070"
                        style={{
                          mixBlendMode: "color-dodge",
                        }}
                      />
                      <path
                        d="M151.473 66.7252H158.462C159.989 66.7252 160.753 65.9717 160.753 64.4646V3.90675C160.753 2.39966 159.989 1.64612 158.462 1.64612H151.237C150.36 1.64612 149.652 1.73796 149.114 1.92165C148.575 2.10534 147.989 2.41117 147.355 2.83915C145.167 4.34671 142.852 5.94646 140.409 7.63841C137.967 9.33036 135.641 10.9405 133.432 12.4687C132.808 12.8868 132.395 13.3219 132.193 13.7741C131.991 14.2263 131.891 14.85 131.891 15.6454V21.5838C131.891 22.2791 132.18 22.7388 132.76 22.9629C133.339 23.1869 133.911 23.0899 134.475 22.6718C137.001 20.951 139.512 19.2251 142.007 17.4941C144.503 15.7632 146.895 14.1195 149.183 12.5631V64.4646C149.183 65.9717 149.946 66.7252 151.473 66.7252Z"
                        fill="#999999"
                        fill-opacity="0.8"
                      />
                      <path
                        d="M151.473 66.7252H158.462C159.989 66.7252 160.753 65.9717 160.753 64.4646V3.90675C160.753 2.39966 159.989 1.64612 158.462 1.64612H151.237C150.36 1.64612 149.652 1.73796 149.114 1.92165C148.575 2.10534 147.989 2.41117 147.355 2.83915C145.167 4.34671 142.852 5.94646 140.409 7.63841C137.967 9.33036 135.641 10.9405 133.432 12.4687C132.808 12.8868 132.395 13.3219 132.193 13.7741C131.991 14.2263 131.891 14.85 131.891 15.6454V21.5838C131.891 22.2791 132.18 22.7388 132.76 22.9629C133.339 23.1869 133.911 23.0899 134.475 22.6718C137.001 20.951 139.512 19.2251 142.007 17.4941C144.503 15.7632 146.895 14.1195 149.183 12.5631V64.4646C149.183 65.9717 149.946 66.7252 151.473 66.7252Z"
                        fill="#707070"
                        style={{
                          mixBlendMode: "color-dodge",
                        }}
                      />
                    </g>
                    <defs>
                      <filter
                        id="filter0_b_77_11985"
                        x="-36.4385"
                        y="-36.4107"
                        width="234.137"
                        height="141.224"
                        filterUnits="userSpaceOnUse"
                        color-interpolation-filters="sRGB"
                      >
                        <feFlood
                          flood-opacity="0"
                          result="BackgroundImageFix"
                        />
                        <feGaussianBlur
                          in="BackgroundImageFix"
                          stdDeviation="18.4729"
                        />
                        <feComposite
                          in2="SourceAlpha"
                          operator="in"
                          result="effect1_backgroundBlur_77_11985"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="effect1_backgroundBlur_77_11985"
                          result="shape"
                        />
                      </filter>
                    </defs>
                  </svg>{" "}
                </>
              )}
            <div
              className={`${
                currentPreviewPlatform === PushPlatforms.IOS
                  ? currentPreviewMode === PreviewOptions.EXPANDED
                    ? `bg-white ${
                        !data.settings[currentPreviewPlatform].image
                          ? "rounded-[22px]"
                          : "rounded-t-[22px]"
                      } `
                    : currentPreviewMode === PreviewOptions.LOCK
                    ? "rounded-[22px] items-center bg-[linear-gradient(121deg,_rgba(221,165,154,1)_0%,_rgba(221,198,176,1)_100%)]  backdrop-blur-[69px] bg-opacity-50"
                    : "bg-[rgba(245,245,245,0.50)] items-center backdrop-blur-[38px] rounded-[14px] !top-[54px]"
                  : `bg-[#E6E9E7] !px-[14px] !py-[19px] !max-w-[350px] rounded !top-[254px] ${
                      currentPreviewMode !== PreviewOptions.EXPANDED &&
                      "items-center"
                    }`
              } max-w-[352px] flex z-[1] w-full left-[14px] absolute p-[12px] ${
                currentPreviewMode === PreviewOptions.BANER
                  ? "!top-[44px]"
                  : "!top-[219px]"
              }`}
            >
              <img
                src={NO_APP_ICON}
                className={`${
                  currentPreviewPlatform === PushPlatforms.ANDROID
                    ? "min-w-[22px] rounded min-h-[22px] max-w-[22px] max-h-[22px]"
                    : "min-w-[35px] rounded-lg min-h-[35px] max-w-[35px] max-h-[35px]"
                }`}
                alt=""
              />
              {currentPreviewPlatform === PushPlatforms.IOS &&
                currentPreviewMode === PreviewOptions.EXPANDED &&
                data.settings[currentPreviewPlatform].image && (
                  <div className="absolute bg-white w-full h-[186px] top-full left-0 rounded-b-[22px]">
                    <img
                      src={
                        data.settings[currentPreviewPlatform].image?.imageSrc
                      }
                      className="object-cover w-full h-full max-w-full max-h-full rounded-b-[22px]"
                      alt=""
                    />
                  </div>
                )}
              <div
                className={`${
                  currentPreviewPlatform === PushPlatforms.IOS
                    ? "ml-[9px]"
                    : "ml-[14px]"
                }  flex flex-col`}
              >
                {currentPreviewPlatform === PushPlatforms.ANDROID &&
                  currentPreviewMode === PreviewOptions.EXPANDED && (
                    <div className="flex items-center text-[#3F4946] font-roboto text-[11px] leading-[14px] mb-[14px]">
                      <span>App name</span>
                      <span className="mx-1">•</span>
                      <span className="">5m</span>
                    </div>
                  )}
                <div
                  className={`${
                    currentPreviewPlatform === PushPlatforms.ANDROID
                      ? `max-w-[240px] ${
                          data.settings[currentPreviewPlatform].image &&
                          "!max-w-[189px] min-w-[189px]"
                        }`
                      : `justify-between min-w-[280px] max-w-[280px] ${
                          currentPreviewMode !== PreviewOptions.EXPANDED &&
                          data.settings.iOS.image &&
                          "pt-[10px]"
                        }`
                  } flex items-center`}
                >
                  <div
                    className={`whitespace-nowrap overflow-hidden text-ellipsis ${
                      currentPreviewPlatform === PushPlatforms.IOS
                        ? "max-w-[215px] w-full text-sm font-semibold font-['PingFang HK'] leading-[18.47px] text-black"
                        : "max-w-full font-roboto text-[13px] font-medium leading-[18px]"
                    }`}
                  >
                    {data.settings[currentPreviewPlatform].title || "Title"}
                  </div>
                  {currentPreviewPlatform === PushPlatforms.ANDROID &&
                    currentPreviewMode !== PreviewOptions.EXPANDED && (
                      <>
                        <span className="mx-1 text-[11px] leading-[14px] font-roboto">
                          •
                        </span>
                        <span className="text-[11px] leading-[14px] font-roboto text-[#3F4946]">
                          5m
                        </span>
                      </>
                    )}
                  {currentPreviewPlatform === PushPlatforms.IOS && (
                    <span
                      className={`${
                        currentPreviewMode === PreviewOptions.EXPANDED
                          ? "text-black"
                          : currentPreviewMode === PreviewOptions.LOCK
                          ? "text-[rgba(127,127,127,0.50)]"
                          : "text-[#591f25]"
                      } text-right text-xs font-normal font-['PingFang HK'] leading-[18.47px] ${
                        currentPreviewMode !== PreviewOptions.EXPANDED &&
                        data.settings.iOS.image &&
                        "-translate-y-[10px]"
                      }`}
                    >
                      9:41 AM
                    </span>
                  )}
                </div>
                <div className="flex justify-between w-full">
                  <div
                    className={`${
                      currentPreviewMode === PreviewOptions.LOCK
                        ? "whitespace-nowrap overflow-hidden text-ellipsis"
                        : currentPreviewMode === PreviewOptions.EXPANDED
                        ? "whitespace-break-spaces"
                        : "whitespace-nowrap overflow-hidden text-ellipsis"
                    } ${
                      currentPreviewMode === PreviewOptions.EXPANDED &&
                      "line-clamp-4"
                    } ${
                      currentPreviewPlatform === PushPlatforms.ANDROID &&
                      `!font-roboto !text-[13px] !text-[#3F4946] ${
                        data.settings[currentPreviewPlatform].image
                          ? "!max-w-[189px] min-w-[189px]"
                          : "!max-w-[240px] "
                      }`
                    } max-w-[220px] text-black text-[14px] font-['PingFang HK'] leading-[18.47px]`}
                  >
                    {data.settings[currentPreviewPlatform].description ||
                      "Description"}
                  </div>
                  {data.settings[currentPreviewPlatform].image &&
                    currentPreviewPlatform === PushPlatforms.IOS &&
                    currentPreviewMode !== PreviewOptions.EXPANDED && (
                      <img
                        src={
                          data.settings[currentPreviewPlatform].image?.imageSrc
                        }
                        className="object-cover min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded-md"
                        alt=""
                      />
                    )}
                </div>
                {data.settings[currentPreviewPlatform].image &&
                  currentPreviewPlatform === PushPlatforms.ANDROID &&
                  currentPreviewMode === PreviewOptions.EXPANDED && (
                    <img
                      src={
                        data.settings[currentPreviewPlatform].image?.imageSrc
                      }
                      className="mt-[11px] object-cover min-w-[285px] min-h-[177px] max-w-[285px] max-h-[177px] rounded"
                      alt=""
                    />
                  )}
              </div>
              {data.settings[currentPreviewPlatform].image &&
                currentPreviewPlatform === PushPlatforms.ANDROID &&
                currentPreviewMode !== PreviewOptions.EXPANDED && (
                  <img
                    src={data.settings[currentPreviewPlatform].image?.imageSrc}
                    className="object-cover mx-auto min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] rounded-md"
                    alt=""
                  />
                )}
              {currentPreviewPlatform === PushPlatforms.ANDROID && (
                <div
                  className={`${
                    !data.settings[currentPreviewPlatform].image?.imageSrc &&
                    "ml-auto"
                  } ${
                    currentPreviewMode === PreviewOptions.EXPANDED &&
                    "absolute right-[15px] top-[15px] rotate-180"
                  } w-[22px] h-[22px] bg-[#E0E3E1] rounded-full flex justify-center items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="15"
                    viewBox="0 0 16 15"
                    fill="none"
                  >
                    <path
                      d="M3.86549 4.81598L3.05267 5.6452L7.66438 10.35L12.2761 5.6452L11.4633 4.81598L7.66438 8.6857"
                      fill="#1C1B1F"
                    />
                  </svg>
                </div>
              )}
            </div>
            {currentPreviewMode === PreviewOptions.EXPANDED &&
              currentPreviewPlatform === PushPlatforms.IOS && (
                <div className="absolute top-0 left-0 p-[7px] w-full h-full">
                  <div className="w-full h-full rounded-[44.3px] backdrop-blur-[10px] bg-[rgba(24,19,43,0.21)]"></div>
                </div>
              )}
            <div className="absolute w-[138px] rounded-[100px] h-[5px] bg-white left-1/2 -translate-x-1/2 bottom-[14px]" />
          </div>
        </div>
        {currentPreviewPlatform === PushPlatforms.IOS && (
          <div className="w-full text-center mt-[14px] font-inter text-[14px] leading-[22px] text-[#4B5563]">
            In iOS 16, notifications will appear at the bottom
          </div>
        )}
      </div>
    </>
  );
};

export default PushBuilderPreviewer;
