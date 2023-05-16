import React, { Fragment, MouseEvent, useState } from "react";
import { dataSubArray } from "./Drawer.fixtures";
import { AuthState } from "../../reducers/auth.reducer";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import LaudspeakerIcon from "../../assets/images/laudspeaker.svg";
import LaudspeakerWhiteIcon from "../../assets/images/laudspeakerWhiteIcon.svg";
import {
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import {
  Bars3CenterLeftIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector } from "store/hooks";

const drawerWidth = 200;

const classNames = (...classes: string[]) => classes.filter(Boolean).join(" ");

interface NavigationItem {
  id: string;
  imgIcon?: JSX.Element;
  text: string;
  type: string;
  link: string;
  children?: NavigationItem[];
}

// const navigationA = dataSubArray as NavigationItem[];
const navigation = [
  { name: "Home", href: "#", icon: HomeIcon, current: true },
  { name: "History", href: "#", icon: ClockIcon, current: false },
  { name: "Balances", href: "#", icon: ScaleIcon, current: false },
  { name: "Cards", href: "#", icon: CreditCardIcon, current: false },
  { name: "Recipients", href: "#", icon: UserGroupIcon, current: false },
  { name: "Reports", href: "#", icon: DocumentChartBarIcon, current: false },
];
const secondaryNavigation = [
  { name: "Settings", href: "#", icon: CogIcon },
  { name: "Help", href: "#", icon: QuestionMarkCircleIcon },
  { name: "Privacy", href: "#", icon: ShieldCheckIcon },
];

export default function ResponsiveDrawerBeta() {
  const userState = useAppSelector<AuthState>((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  /* Static sidebar for desktop */
  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex flex-grow flex-col overflow-y-auto bg-cyan-700 pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            {/* src="https://tailwindui.com/img/logos/mark.svg?color=cyan&shade=300" */}
            <img
              className="h-8 w-auto"
              src={LaudspeakerWhiteIcon}
              alt="Easywire logo"
            />
          </div>
          <nav
            className="mt-5 flex flex-1 flex-col divide-y divide-cyan-800 overflow-y-auto"
            aria-label="Sidebar"
          >
            <div className="space-y-1 px-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-cyan-800 text-white"
                      : "text-cyan-100 hover:text-white hover:bg-cyan-600",
                    "group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  <item.icon
                    className="mr-4 h-6 w-6 flex-shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </div>
            <div className="mt-6 pt-6">
              <div className="space-y-1 px-2">
                {secondaryNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center rounded-md px-2 py-2 text-sm font-medium leading-6 text-cyan-100 hover:bg-cyan-600 hover:text-white"
                  >
                    <item.icon
                      className="mr-4 h-6 w-6 text-cyan-200"
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );

  {
    /*
    <div
      className={`flex flex-grow flex-col border-r border-gray-200 bg-white pt-5 pb-4 h-full transition-all duration-500 ease-in-out max-w-[54px] hover:!max-w-[200px] `}
    >
      <div className="flex flex-shrink-0 items-center pl-4">
        <img
          className="h-8 w-full max-w-[23px]"
          src={LaudspeakerIcon}
          alt="Laudspeaker"
        />
      </div>
      <div className="mt-5 flex flex-grow flex-col overflow-x-hidden">
        <nav className="flex-1 space-y-1 bg-white px-2" aria-label="Sidebar">
          {navigation.map((item) =>
            !item.children ? (
              <React.Fragment key={item.id}>
                {userState.userPermissions?.includes(item.id) && (
                  <div
                    onClick={(ev: MouseEvent<HTMLDivElement>) => {
                      ev.preventDefault();
                      navigate(item.link);
                    }}
                    className="cursor-pointer"
                  >
                    <div
                      className={classNames(
                        location.pathname.includes(item.link)
                          ? "bg-gray-300 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        "group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md"
                      )}
                    >
                      <div
                        className={classNames(
                          location.pathname.includes(item.link)
                            ? "text-gray-500"
                            : "text-gray-400 group-hover:text-gray-500",
                          "mr-4 flex-shrink-0 h-6 w-6"
                        )}
                        aria-hidden="true"
                      >
                        {item.imgIcon}
                      </div>
                      {item.text}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ) : (
              <Disclosure
                as="div"
                key={item.id}
                className="space-y-1"
                defaultOpen={item.children.some((child) =>
                  location.pathname.includes(child.link)
                )}
              >
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={classNames(
                        location.pathname.includes(item.link)
                          ? "bg-gray-300 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        "group w-full flex transition-all items-center pl-2 pr-1 py-2 text-left text-sm font-medium rounded-md outline-none"
                      )}
                    >
                      <div
                        className={classNames(
                          location.pathname.includes(item.link)
                            ? "text-gray-500"
                            : "text-gray-400 group-hover:text-gray-500",
                          "mr-4 flex-shrink-0 h-6 w-6"
                        )}
                        aria-hidden="true"
                      >
                        {item.imgIcon}
                      </div>
                      <span className="flex-1">{item.text}</span>
                      <svg
                        className={classNames(
                          open ? "text-gray-400 rotate-90" : "text-gray-300",
                          "ml-3 h-5 w-5 flex-shrink-0 transform transition-colors duration-150 ease-in-out group-hover:text-gray-400"
                        )}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M6 6L14 10L6 14V6Z" fill="currentColor" />
                      </svg>
                    </Disclosure.Button>
                    <Disclosure.Panel className="space-y-1">
                      {item.children?.map((subItem) => (
                        <>
                          {userState.userPermissions?.includes(subItem.id) && (
                            <Disclosure.Button
                              onClick={(ev: MouseEvent<HTMLButtonElement>) => {
                                ev.preventDefault();
                                navigate(subItem.link);
                              }}
                              key={subItem.text}
                              className={`${classNames(
                                location.pathname.includes(subItem.link) &&
                                  "!bg-gray-300"
                              )} group flex w-full transition-all whitespace-nowrap outline-none items-center rounded-md py-2 px-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                            >
                              <div
                                className={classNames(
                                  location.pathname.includes(subItem.link)
                                    ? "text-gray-500"
                                    : "text-gray-400 group-hover:text-gray-500",
                                  "mr-4 flex-shrink-0 h-6 w-6"
                                )}
                              >
                                {subItem.imgIcon}
                              </div>
                              {subItem.text}
                            </Disclosure.Button>
                          )}
                        </>
                      ))}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            )
          )}
        </nav>
      </div>
    </div>
  );
    */
  }
}
