import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { PlatformSettings, PushClickBehavior } from "./PushBuilderContent";
import PushBuilderMediaUpload from "./PushBuilderMediaUpload";

interface PlatformSettingsComponentsProps {
  data: PlatformSettings;
  onChange: (data: PlatformSettings) => void;
}

const PlatformSettingsComponents = ({
  data,
  onChange,
}: PlatformSettingsComponentsProps) => (
  <>
    <div className="font-inter text-[14px] leading-[22px] mt-[10px] mb-[5px]">
      Title
    </div>
    <Input
      placeholder="Text that appears above your message"
      value={data.title}
      wrapperClassName="!w-full"
      className="!w-full !rounded-sm"
      onChange={(val) => {
        onChange({
          ...data,
          title: val,
        });
      }}
    />
    <div className="font-inter text-[14px] leading-[22px] mt-[10px] mb-[5px]">
      Message
    </div>
    <textarea
      value={data.description}
      className="resize-none w-full border border-[#E5E7EB] rounded px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none"
      placeholder="Message you want to send"
      rows={3}
      onChange={(ev) => {
        onChange({
          ...data,
          description: ev.target.value || "",
        });
      }}
    />
    <div className="font-inter text-[14px] leading-[22px] mt-[10px] mb-[5px]">
      Image
    </div>
    <PushBuilderMediaUpload
      img={data.image}
      onImageUploaded={(newImg) => onChange({ ...data, image: newImg })}
    />
    <div className="font-inter text-[14px] leading-[22px] mt-[10px] mb-[5px]">
      On click behavior
    </div>
    <Select
      value={data.clickBehavior.type}
      options={[
        {
          key: PushClickBehavior.OPEN_APP,
          title: "Open App",
        },
        {
          key: PushClickBehavior.REDIRECT_URL,
          title: "Redirect to Web URL",
        },
      ]}
      onChange={(key) =>
        onChange({
          ...data,
          clickBehavior: {
            ...data.clickBehavior,
            type: key,
          },
        })
      }
    />
    {data.clickBehavior.type === PushClickBehavior.REDIRECT_URL && (
      <Input
        placeholder="Web URL"
        value={data.clickBehavior.webURL}
        wrapperClassName="!w-full mt-[5px]"
        className="!w-full !rounded-sm"
        onChange={(val) => {
          onChange({
            ...data,
            clickBehavior: {
              ...data.clickBehavior,
              webURL: val,
            },
          });
        }}
      />
    )}
  </>
);

export default PlatformSettingsComponents;
