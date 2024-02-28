import { FC, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { useAppSelector } from "store/hooks";
import { useNavigate } from "react-router-dom";
import React from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface HeaderProps {
  crumbs?: { text: string; link?: string }[];
}

const Header: FC<HeaderProps> = ({ crumbs }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    document.cookie = "";
    window.location.reload();
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
        <div>
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
        </div>
        {(firstName || lastName || email) && (
          <Menu as="div" className="relative ml-3 z-auto">
            <div>
              <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none lg:p-2 lg:hover:bg-gray-50">
                <span className="ml-3 hidden text-[14px] leading-[22px] font-roboto  text-[#4B5563] lg:block">
                  <span className="sr-only">Open user menu for </span>
                  {firstName || lastName || email}
                </span>
                <ChevronDownIcon
                  className="ml-1 hidden h-5 w-5 flex-shrink-0 text-[#4B5563] lg:block"
                  aria-hidden="true"
                />
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
              <Menu.Items className="absolute z-[120] right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link to="/settings">
                      <div
                        className={classNames(
                          active ? "bg-gray-100" : "",
                          "block px-4 py-2 text-sm text-gray-700"
                        )}
                      >
                        Settings
                      </div>
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div
                      className={classNames(
                        active ? "bg-gray-100" : "",
                        "block px-4 py-2 text-sm text-gray-700 cursor-pointer"
                      )}
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </div>
  );
};

export default Header;
