import React, { Fragment, useState } from "react";
import { dataSubArray } from "./Drawer.fixtures";
import { AuthState } from "../../reducers/auth";
import { useTypedSelector } from "../../hooks/useTypeSelector";
import { Link, useLocation } from "react-router-dom";
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import LaudspeakerIcon from "../../assets/images/laudspeaker.svg";
import {
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const drawerWidth = 200;

const classNames = (...classes: any[]) => classes.filter(Boolean).join(" ");

interface NavigationItem {
  id: string;
  imgIcon?: JSX.Element;
  text: string;
  type: string;
  link: string;
  children?: NavigationItem[];
}

const navigation = dataSubArray as NavigationItem[];

export default function ResponsiveDrawer() {
  const userState = useTypedSelector<AuthState>((state) => state.auth);
  const location = useLocation();

  return (
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
                  <div>
                    <Link to={item.link}>
                      <div
                        className={classNames(
                          location.pathname.includes(item.link)
                            ? "bg-gray-100 text-gray-900"
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
                    </Link>
                  </div>
                )}
              </React.Fragment>
            ) : (
              <Disclosure as="div" key={item.id} className="space-y-1">
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={classNames(
                        location.pathname.includes(item.link)
                          ? "bg-gray-100 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        "group w-full flex items-center pl-2 pr-1 py-2 text-left text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                            <Link key={subItem.id} to={subItem.link}>
                              <Disclosure.Button
                                key={subItem.text}
                                className="group flex w-full whitespace-nowrap items-center rounded-md py-2 px-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <div
                                  className={classNames(
                                    location.pathname.includes(item.link)
                                      ? "text-gray-500"
                                      : "text-gray-400 group-hover:text-gray-500",
                                    "mr-4 flex-shrink-0 h-6 w-6"
                                  )}
                                >
                                  {subItem.imgIcon}
                                </div>
                                {subItem.text}
                              </Disclosure.Button>
                            </Link>
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
}
