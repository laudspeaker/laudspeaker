import Button, { ButtonType } from "components/Elements/Buttonv2";
import { PushSettingsConfiguration } from "./PushSettings";

interface PushSettingsAddUsersProps {
  config: PushSettingsConfiguration;
  updateConfig: (values: Partial<PushSettingsConfiguration>) => void;
}

const PushSettingsAddUsers = ({
  config,
  updateConfig,
}: PushSettingsAddUsersProps) => {
  return (
    <>
      <div className="mb-[-10px] font-inter text-[#111827] text-base font-semibold">
        Integrate with SDK (Recommended)
      </div>
      <div className="p-5 border-[#E5E7EB] border bg-[#F9FAFB] rounded-sm text-sm font-inter text-[#111827]">
        Instructions for SDK Instructions for SDK Instructions for SDK
        <br />
        Instructions for SDK Instructions for SDK Instructions for SDK
      </div>
      <div className="font-inter text-[#111827] text-sm font-semibold">
        Want to import users manully?
      </div>
      <div className="p-5 flex items-center justify-between border-[#E5E7EB] border bg-[#F9FAFB] rounded-sm text-sm font-inter text-[#111827]">
        instruction instruction instruction instruction instruction instruction
        instruction instruction
        <Button
          className="text-[#6366F1]"
          type={ButtonType.SECONDARY}
          onClick={() => {}}
        >
          Import users
        </Button>
      </div>
    </>
  );
};

export default PushSettingsAddUsers;
