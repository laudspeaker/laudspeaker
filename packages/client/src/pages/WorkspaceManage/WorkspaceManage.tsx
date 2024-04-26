import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Table from "components/Tablev2";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";

export interface Workspace {
  id: string;
  name: string;
  // members: unknown[];
  createdAt: string;
}

const WorkspaceManage = () => {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const loadWorkspaces = async () => {
    const { data } = await ApiService.get({ url: "/workspaces" });

    setWorkspaces(data);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    setNewWorkspaceName("");
  }, [isCreating]);

  const handleCreateWorkspace = async () => {
    try {
      await ApiService.post({
        url: "/workspaces",
        options: { name: newWorkspaceName },
      });
      setIsCreating(false);
      location.reload();
    } catch (e) {
      toast.error("Unexpected error during workspace creation");
    }
  };

  const updateCurrentWorkspace = async (id: string) => {
    await ApiService.post({ url: "/workspaces/set/" + id });
  };

  return (
    <div className="w-full flex justify-center p-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        {isCreating ? (
          <>
            <div className="flex items-center gap-[15px]">
              <BackButton onClick={() => setIsCreating(false)} />
              <div className="font-semibold text-[20px] leading-[28px]">
                Create workspace
              </div>
            </div>

            <div className="bg-white p-5 rounded flex flex-col gap-5">
              <div className="flex flex-col gap-[5px] pb-5 border-b border-[#E5E7EB]">
                <div>Workspace name</div>
                <Input
                  className="!w-full"
                  wrapperClassName="!w-full"
                  value={newWorkspaceName}
                  onChange={setNewWorkspaceName}
                  placeholder="name your workspace"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName}
                >
                  Save
                </Button>
                <Button
                  type={ButtonType.SECONDARY}
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold text-[20px] leading-[28px]">
              Manage workspace
            </div>
            <div className="bg-white rounded p-5 flex flex-col gap-2.5">
              <div className="flex justify-end">
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={() => setIsCreating(true)}
                >
                  Create workspace
                </Button>
              </div>

              <Table
                rowsData={[]}
                headings={[
                  <div className="px-5 py-2.5 font-semibold">
                    Workspace name
                  </div>,
                  <div className="px-5 py-2.5 font-semibold">Team members</div>,
                  <div className="px-5 py-2.5 font-semibold">Create</div>,
                ]}
                rows={workspaces.map((workspace) => [
                  <div
                    className="text-[#6366F1] cursor-pointer"
                    onClick={() => {
                      updateCurrentWorkspace(workspace.id);
                      navigate("/settings");
                      location.reload();
                    }}
                  >
                    {workspace.name}
                  </div>,
                  <div>
                    N/A
                    {/* {workspace.members.length} */}
                  </div>,
                  <div>
                    {format(new Date(workspace.createdAt), "dd/MM/yyyy HH:mm")}
                  </div>,
                ])}
                headClassName="bg-[#F3F4F6]"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkspaceManage;
