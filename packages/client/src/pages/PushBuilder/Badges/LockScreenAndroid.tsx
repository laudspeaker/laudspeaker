import { PlatformSettings } from "../PushBuilderContent";
import NO_APP_ICON from "../assets/images/noAppIcon.jpg";

interface LockScreenAndroidProps {
  settings: PlatformSettings;
}

const LockScreenAndroid = ({ settings }: LockScreenAndroidProps) => {
  return (
    <div className="w-full bg-[#f1f1f1] rounded-[3px] p-[12.6px]">
      <div className={`flex w-full items-center`}>
        <img
          src={NO_APP_ICON}
          className="min-w-[19px] max-w-[19px] rounded-[4px] min-h-[19px] max-h-[19px] mr-2"
          alt=""
        />
        <div className={`w-full flex flex-col `}>
          <div className="flex w-full items-center">
            <div
              className={`${
                settings.image ? "max-w-[136px]" : "max-w-[182px]"
              } text-[#1C1B1F] whitespace-nowrap font-medium text-[11px] overflow-hidden text-ellipsis font-roboto leading-[15.6px]`}
            >
              {settings.title}
            </div>
            <div className="flex items-center text-[#3F4946] font-roboto text-[9px] leading-3">
              <span className="mx-1">•</span>
              <span className="">5m</span>
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div
              className={`${
                settings.image ? "max-w-[160px]" : "max-w-[182px]"
              } text-[#3F4946] whitespace-nowrap text-[11.7px] font-roboto leading-[15.6px] overflow-hidden text-ellipsis`}
            >
              {settings.description}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {settings.image && (
            <img
              src={settings.image.imageSrc}
              className="object-cover min-w-[37.9px] min-h-[37.9px] max-w-[37.9px] max-h-[37.9px] rounded-[3.42px] mx-[12.63px]"
              alt=""
            />
          )}

          <div
            className={`${
              settings.image && "ml-auto"
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
        </div>
      </div>
    </div>
  );
};

export default LockScreenAndroid;
