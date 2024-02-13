import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import React from "react";

const WorkspaceAccountSettings = () => {
  return (
    <div className="w-full flex justify-center p-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="font-semibold text-[20px] leading-[28px]">Account</div>
        <div className="bg-white rounded p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 border-b border-[#E5E7EB] pb-5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Profile
            </div>
            <div className="flex items-center gap-5">
              <div className="flex flex-col gap-[5px] w-full">
                <div>First name</div>
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full"
                  value=""
                  onChange={() => {}}
                />
              </div>
              <div className="flex flex-col gap-[5px] w-full">
                <div>Last name</div>
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full"
                  value=""
                  onChange={() => {}}
                />
              </div>
            </div>
            <div className="flex flex-col gap-[5px] w-full">
              <div>Email</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <Button type={ButtonType.PRIMARY} onClick={() => {}} disabled>
                Save
              </Button>
              <Button type={ButtonType.SECONDARY} onClick={() => {}} disabled>
                Cancel
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 border-b border-[#E5E7EB] pb-5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Password
            </div>
            <div className="flex flex-col gap-[5px] w-full">
              <div>Current password</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value=""
                onChange={() => {}}
              />
            </div>

            <div className="flex flex-col gap-[5px] w-full">
              <div>New password</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value=""
                onChange={() => {}}
              />
            </div>

            <div className="flex flex-col gap-[5px] w-full">
              <div>Confirm new password</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value=""
                onChange={() => {}}
              />
            </div>

            <Button
              className="!w-fit"
              type={ButtonType.PRIMARY}
              onClick={() => {}}
              disabled
            >
              Change password
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Delete account
            </div>

            <Button
              className="!w-fit"
              type={ButtonType.DANGEROUS}
              onClick={() => {}}
              disabled
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAccountSettings;
