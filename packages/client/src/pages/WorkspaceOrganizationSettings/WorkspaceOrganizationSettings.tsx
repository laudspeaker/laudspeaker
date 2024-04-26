import BackButton from "components/BackButton";
import Input from "components/Elements/Inputv2";
import OrganizationTab, {
  OrganizationTeamData,
} from "pages/Settingsv2/tabs/OrganizationTab";
import React, { useState } from "react";

const WorkspaceOrganizationSettings = () => {
  const [viewTeamMember, setViewTeamMember] = useState<OrganizationTeamData>();

  return (
    <div className="w-full flex justify-center p-5">
      {viewTeamMember ? (
        <>
          <div className="max-w-[970px] w-full flex flex-col gap-5">
            <div className="flex gap-[15px] items-center">
              <BackButton onClick={() => setViewTeamMember(undefined)} />
              <div className="text-[20px] font-semibold leading-[28px] text-black">
                {viewTeamMember.name} {viewTeamMember.lastName}
              </div>
            </div>

            <div className="bg-white p-5 flex-col">
              <div className="flex justify-center gap-5 w-full">
                <div className="flex flex-col w-full">
                  <div className="text-sm font-inter text-[#111827] mb-[5px]">
                    First name
                  </div>
                  <Input
                    onChange={() => {}}
                    value={viewTeamMember.name}
                    placeholder="No first name"
                    wrapperClassName="!max-w-full w-full"
                    className="w-full !bg-[#F3F4F6]"
                    disabled
                  />
                </div>
                <div className="flex flex-col w-full">
                  <div className="text-sm font-inter text-[#111827] mb-[5px]">
                    Last name
                  </div>
                  <Input
                    onChange={() => {}}
                    value={viewTeamMember.lastName}
                    placeholder="No last name"
                    wrapperClassName="!max-w-full w-full"
                    className="w-full !bg-[#F3F4F6]"
                    disabled
                  />
                </div>
              </div>
              <div className="text-sm font-inter text-[#111827] mb-[5px]  mt-[10px]">
                Email
              </div>
              <Input
                onChange={() => {}}
                value={viewTeamMember.email}
                placeholder="No email"
                wrapperClassName="!max-w-full w-full"
                className="w-full !bg-[#F3F4F6]"
                disabled
              />
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-[970px] w-full flex flex-col gap-5">
          <div className="font-inter font-semibold text-[20px] leading-[28px]">
            Organization
          </div>
          <div className="bg-white rounded">
            <OrganizationTab setViewTeamMember={setViewTeamMember} />
          </div>
        </div>
      )}
    </div>

    // <div className="w-full p-5 flex justify-center font-inter font-normal text-[#111827] text-[14px] leading-[22px]">
    //   <div className="max-w-[970px] w-full flex flex-col gap-5">
    //     <div className="font-semibold text-[20px] leading-[28px]">
    //       Organization
    //     </div>

    //     <div className="flex flex-col gap-2.5">
    //       <div className="bg-white px-[15px] flex items-center gap-8">
    //         <div>General</div>
    //         <div>Team members</div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default WorkspaceOrganizationSettings;
