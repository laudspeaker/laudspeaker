import Button, { ButtonType } from "components/Elements/Buttonv2";
import Table from "components/Tablev2";
import { format } from "date-fns";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Workspace {
  id: string;
  name: string;
  members: unknown[];
  createdAt: string;
}

const WorkspaceManage = () => {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: "1111",
      name: "workspace1",
      members: [1, 2, 3],
      createdAt: new Date().toUTCString(),
    },
  ]);

  return (
    <div className="w-full flex justify-center p-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="font-semibold text-[20px] leading-[28px]">
          Manage workspace
        </div>

        <div className="bg-white rounded p-5 flex flex-col gap-2.5">
          <div className="flex justify-end">
            <Button type={ButtonType.PRIMARY} onClick={() => {}}>
              Create workspace
            </Button>
          </div>

          <Table
            rowsData={[]}
            headings={[
              <div className="px-5 py-2.5 font-semibold">Workspace name</div>,
              <div className="px-5 py-2.5 font-semibold">Team members</div>,
              <div className="px-5 py-2.5 font-semibold">Create</div>,
            ]}
            rows={workspaces.map((workspace) => [
              <div
                className="text-[#6366F1] cursor-pointer"
                onClick={() => navigate("/settings/workspaces/" + workspace.id)}
              >
                {workspace.name}
              </div>,
              <div>{workspace.members.length}</div>,
              <div>
                {format(new Date(workspace.createdAt), "dd/MM/yyyy HH:mm")}
              </div>,
            ])}
            headClassName="bg-[#F3F4F6]"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceManage;
