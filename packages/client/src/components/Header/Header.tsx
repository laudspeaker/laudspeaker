import { FC, Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { useAppSelector } from "store/hooks";
import { useNavigate } from "react-router-dom";
import React from "react";
import ApiService from "services/api.service";
import { Workspace } from "pages/WorkspaceManage/WorkspaceManage";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface HeaderProps {
  crumbs?: { text: string; link?: string }[];
}

const workspaceColors = ["#6366F1", "#22C55E", "#EAB308", "#0EA5E9"];

const Header: FC<HeaderProps> = ({ crumbs }) => {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>();

  const loadWorkspaces = async () => {
    const { data } = await ApiService.get<Workspace[]>({ url: "/workspaces" });
    setWorkspaces(data);

    const { data: newCurrentWorkspace } = await ApiService.get<Workspace>({
      url: "/workspaces/current",
    });
    setCurrentWorkspace(newCurrentWorkspace);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    document.cookie = "";
    window.location.reload();
  };

  const updateCurrentWorkspace = async (id: string) => {
    await ApiService.post({ url: "/workspaces/set/" + id });
    location.reload();
  };

  const { firstName, lastName, email } = useAppSelector(
    (state) => state.auth.userData
  );

  return (
    <div className="w-full h-[46px] bg-white border-[0px] px-[16px] py-[12px] flex justify-between items-center">
      <div className="flex items-center gap-2 font-roboto font-normal text-[14px] leading-[22px] text-[#000000D9] select-none">
        {crumbs?.map((crumb, i) => (
          <Fragment key={i}>
            <div
              className={`cursor-pointer ${i === 0 ? "text-[#00000073]" : ""}`}
              onClick={() => {
                if (crumb.link) navigate(crumb.link);
              }}
              key={i}
            >
              {crumb.text}
            </div>
            {i !== crumbs.length - 1 && (
              <div className={i === 0 ? "text-[#00000073]" : ""}>/</div>
            )}
          </Fragment>
        ))}
      </div>
      <div className="flex items-center">
        {/* <div>
          <svg
            width="18"
            height="20"
            viewBox="0 0 20 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 7C16 5.4087 15.3679 3.88258 14.2426 2.75736C13.1174 1.63214 11.5913 1 10 1C8.4087 1 6.88258 1.63214 5.75736 2.75736C4.63214 3.88258 4 5.4087 4 7C4 14 1 16 1 16H19C19 16 16 14 16 7Z"
              stroke="#4B5563"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.7295 20C11.5537 20.3031 11.3014 20.5547 10.9978 20.7295C10.6941 20.9044 10.3499 20.9965 9.99953 20.9965C9.64915 20.9965 9.30492 20.9044 9.0013 20.7295C8.69769 20.5547 8.44534 20.3031 8.26953 20"
              stroke="#4B5563"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div> */}
        {(firstName || lastName || email) && (
          <Menu as="div" className="relative ml-3 z-auto">
            <div>
              <Menu.Button
                className="bg-white hover:bg-[#F3F4F6] rounded h-[30px] flex items-center gap-[5px] p-1"
                data-testid="workspace-picker-btn"
              >
                <div className="font-robot text-[14px] font-normal leading-[22px] text-[#4B5563]">
                  {currentWorkspace?.name}
                </div>
                <div
                  className="w-[22px] h-[22px] rounded text-white text-[11px] leading-[18px] flex justify-center items-center"
                  style={{
                    backgroundColor:
                      workspaceColors[
                        workspaces.findIndex(
                          (workspace) => workspace.id === currentWorkspace?.id
                        ) % 4
                      ],
                  }}
                >
                  {currentWorkspace?.name
                    .split(" ")
                    .map((item) => item[0].toUpperCase())
                    .splice(0, 2)
                    .join("")}
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-[120] right-0 mt-2 w-[220px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none font-inter font-normal text-[#111827] text-[14px] leading-[22px]">
                <div className="py-1">
                  {workspaces.map((workspace, i) => (
                    <Menu.Item key={i}>
                      {({ active }) => (
                        <div
                          className={`p-2.5 cursor-pointer flex items-center justify-between ${
                            active ? " bg-gray-100" : ""
                          }`}
                          onClick={() => updateCurrentWorkspace(workspace.id)}
                          data-testid={`workspace-${i}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-[22px] h-[22px] rounded text-white text-[11px] leading-[18px] flex justify-center items-center"
                              style={{
                                backgroundColor: workspaceColors[i % 4],
                              }}
                            >
                              {workspace.name
                                .split(" ")
                                .map((item) => item[0].toUpperCase())
                                .splice(0, 2)
                                .join("")}
                            </div>
                            <div>{workspace.name}</div>
                          </div>
                          {workspace.id === currentWorkspace?.id && (
                            <div>
                              <svg
                                width="14"
                                height="12"
                                viewBox="0 0 14 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M1.375 6.5625L5.875 11.0625L12.625 0.9375"
                                  stroke="#6366F1"
                                  strokeWidth="1.125"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>

                <div className="h-[1px] w-full bg-[#E5E7EB]" />

                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link to="/settings/workspace/account">
                        <div
                          className={classNames(
                            active ? "bg-gray-100" : "",
                            "block p-2.5"
                          )}
                          data-testid="manage-account-btn"
                        >
                          Manage account
                        </div>
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        className={classNames(
                          active ? "bg-gray-100" : "",
                          "block p-2.5 cursor-pointer"
                        )}
                        onClick={handleLogout}
                        data-testid="logout-btn"
                      >
                        Log out
                      </div>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </div>
  );
};

export default Header;
