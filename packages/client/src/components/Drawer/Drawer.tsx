import React, { Fragment, MouseEvent, useState } from "react";
import { dataSubArray } from "./Drawer.fixtures";
import { AuthState } from "../../reducers/auth";
import { useTypedSelector } from "../../hooks/useTypeSelector";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, Disclosure, Transition } from "@headlessui/react";
import LaudspeakerIcon from "../../assets/images/laudspeakerIcon.svg";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useDispatch } from "react-redux";
import { toggleNavbar } from "reducers/settings";

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
  const dispatch = useDispatch();
  const isNavOpened = useTypedSelector((state) => state.settings.navbarOpened);
  const location = useLocation();
  const navigate = useNavigate();

  const handleCloseClick = () => {
    dispatch(toggleNavbar(false));
  };

  return (
    <>
      {((
        generalNav = (
          <>
            {navigation.map((item) =>
              !item.children ? (
                <React.Fragment key={item.id}>
                  {userState.userPermissions?.includes(item.id) && (
                    <div
                      onClick={(ev: MouseEvent<HTMLDivElement>) => {
                        ev.preventDefault();
                        handleCloseClick();
                        navigate(item.link);
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={classNames(
                          location.pathname.includes(item.link)
                            ? "bg-cyan-800 text-white"
                            : "bg-cyan-700 text-cyan-100 hover:bg-cyan-600 hover:text-white",
                          "group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md"
                        )}
                      >
                        <div
                          className={classNames(
                            location.pathname.includes(item.link)
                              ? "text-white"
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
                            ? "bg-cyan-800 text-white"
                            : "bg-cyan-700 text-cyan-100 hover:bg-cyan-600 hover:white",
                          "group w-full flex transition-all items-center pl-2 pr-1 py-2 text-left text-sm font-medium rounded-md outline-none"
                        )}
                      >
                        <div
                          className={classNames(
                            location.pathname.includes(item.link)
                              ? "text-white"
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
                            {userState.userPermissions?.includes(
                              subItem.id
                            ) && (
                              <Disclosure.Button
                                onClick={(
                                  ev: MouseEvent<HTMLButtonElement>
                                ) => {
                                  ev.preventDefault();
                                  navigate(subItem.link);
                                  handleCloseClick();
                                }}
                                key={subItem.text}
                                className={`${classNames(
                                  location.pathname.includes(subItem.link) &&
                                    "!bg-cyan-800 text-white"
                                )} group bg-cyan-700 flex w-full transition-all whitespace-nowrap outline-none items-center rounded-md py-2 px-2 text-sm font-medium text-cyan-100 hover:bg-cyan-600 hover:text-white`}
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
          </>
        )
      ) => (
        <>
          <Transition.Root show={!!isNavOpened} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-40 lg:hidden"
              onClose={handleCloseClick}
            >
              <Transition.Child
                as={Fragment}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
              </Transition.Child>

              <div className="fixed inset-0 z-40 flex">
                <Transition.Child
                  as={Fragment}
                  enter="transition ease-in-out duration-300 transform"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transition ease-in-out duration-300 transform"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="relative flex w-full max-w-[260px] flex-1 flex-col bg-cyan-700 pt-5 pb-4">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-in-out duration-300"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                      leave="ease-in-out duration-300"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <div className="absolute top-0 right-0 -mr-14 p-1">
                        <button
                          type="button"
                          className="flex h-12 w-12 items-center justify-center rounded-full focus:bg-gray-600 focus:outline-none"
                          onClick={() => dispatch(toggleNavbar(false))}
                        >
                          <XMarkIcon
                            className="h-6 w-6 text-white"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Close sidebar</span>
                        </button>
                      </div>
                    </Transition.Child>
                    <div className="flex flex-shrink-0 items-center px-2">
                      <img
                        className="h-8 w-auto"
                        src={LaudspeakerIcon}
                        alt="Easywire"
                      />
                    </div>
                    <div className="mt-5 h-0 flex-1 overflow-y-auto">
                      <nav className="flex h-full flex-col">
                        <div className="space-y-1">{generalNav}</div>
                      </nav>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>

          <div
            className={`flex-grow flex-col border-r border-gray-200 bg-cyan-700 pt-5 pb-4 h-full transition-all duration-500 ease-in-out max-w-[225px] hidden lg:flex`}
          >
            <div className="flex flex-shrink-0 items-center px-4">
              <img className="h-8" src={LaudspeakerIcon} alt="Laudspeaker" />
            </div>
            {/* overflow-x-hidden */}
            <div className="mt-5 flex flex-grow flex-col overflow-x-hidden">
              <nav
                className="flex-1 space-y-1 bg-cyan-700 px-2"
                aria-label="Sidebar"
              >
                {generalNav}
              </nav>
            </div>
          </div>
        </>
      ))()}
    </>
  );
}
