import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { PlatformSettings, PushClickBehavior } from "./PushBuilderContent";
import PushBuilderMediaUpload from "./PushBuilderMediaUpload";

interface AndroidOnlySettingsProps {
  data: PlatformSettings;
  onChange: (data: PlatformSettings) => void;
}

const AndroidOnlySettings = ({ data, onChange }: AndroidOnlySettingsProps) => (
  <>
    <div className="font-inter text-[14px] leading-[22px] mt-[10px] mb-[5px]">
      Summary text / image caption (optional)
    </div>
    <Input
      placeholder="Summary text only for Android"
      value={data.summary}
      wrapperClassName="!w-full"
      className="!w-full !rounded-sm"
      onChange={(val) => {
        onChange({
          ...data,
          summary: val,
        });
      }}
    />
    <div className="font-inter text-[14px] leading-[22px] mt-[10px] mb-[5px]">
      Expanded notification image (optional)
    </div>
    <PushBuilderMediaUpload
      img={data.expandedImage}
      onImageUploaded={(newImg) => onChange({ ...data, expandedImage: newImg })}
    />
  </>
);

export default AndroidOnlySettings;
