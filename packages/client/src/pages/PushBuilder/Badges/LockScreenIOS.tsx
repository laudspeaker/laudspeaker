import { PlatformSettings } from "../PushBuilderContent";
import NO_APP_ICON from "../assets/images/noAppIcon.jpg";

interface LockScreenIOSProps {
  settings: PlatformSettings;
}

const LockScreenIOS = ({ settings }: LockScreenIOSProps) => {
  return (
    <div className="w-full bg-[#f1f1f1] rounded-[18.8px] p-[11px]">
      <div className={`flex w-full ${settings.image && "pt-[10px]"}`}>
        <img
          src={NO_APP_ICON}
          className="min-w-[29px] max-w-[29px] rounded-lg min-h-[29px] max-h-[29px] mr-[7.83px]"
          alt=""
        />
        <div className={`w-full flex flex-col `}>
          <div className="flex w-full justify-between items-center">
            <div className="text-black whitespace-nowrap font-semibold text-[11.7px] max-w-[182px] overflow-hidden text-ellipsis font-['PingFang HK'] leading-[15.6px]">
              {settings.title}
            </div>
            <div
              className={`text-[#3D3D3D] text-[10px] font-['PingFang HK'] leading-[15.6px] ${
                settings.image && "-translate-y-[10px]"
              }`}
            >
              9:41 AM
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div className="text-black whitespace-nowrap text-[11.7px] font-['PingFang HK'] leading-[15.6px] max-w-[196px] overflow-hidden text-ellipsis">
              {settings.description}
            </div>
            {settings.image && (
              <img
                src={settings.image.imageSrc}
                className="object-cover min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded-md"
                alt=""
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockScreenIOS;
