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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  return (
    <div
      className={`flex flex-grow flex-col border-r border-gray-200 bg-white pt-5 pb-4 h-full transition-all duration-500 ease-in-out max-w-[54px] hover:!max-w-[200px] `}
      onMouseEnter={() => setMobileMenuOpen(true)}
      onMouseLeave={() => setMobileMenuOpen(false)}
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
                                  aria-hidden="true"
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
      {/* /////h22222222 */}
      {/* <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 md:hidden h-full w-full"
          onClose={setMobileMenuOpen}
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
            <div className="hidden sm:fixed sm:inset-0 sm:block sm:bg-gray-600 sm:bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-150 sm:ease-in-out sm:duration-300"
              enterFrom="transform opacity-0 scale-110 sm:translate-x-full sm:scale-100 sm:opacity-100"
              enterTo="transform opacity-100 scale-100  sm:translate-x-0 sm:scale-100 sm:opacity-100"
              leave="transition ease-in duration-150 sm:ease-in-out sm:duration-300"
              leaveFrom="transform opacity-100 scale-100 sm:translate-x-0 sm:scale-100 sm:opacity-100"
              leaveTo="transform opacity-0 scale-110  sm:translate-x-full sm:scale-100 sm:opacity-100"
            >
              <Dialog.Panel
                className="fixed inset-0 z-40 h-full w-full bg-white sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-sm sm:shadow-lg"
                aria-label="Global"
              >
                <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                  <div>
                    <img
                      className="block h-8 w-auto"
                      src={LaudspeakerIcon}
                      alt="Laudspeaker"
                    />
                  </div>
                  <button
                    type="button"
                    className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close main menu</span>
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="max-w-8xl mx-auto mt-2 px-4 sm:px-6">
                  <div className="relative text-gray-400 focus-within:text-gray-500">
                    <label htmlFor="mobile-search" className="sr-only">
                      Search all inboxes
                    </label>
                    <input
                      id="mobile-search"
                      type="search"
                      placeholder="Search all inboxes"
                      className="block w-full rounded-md border-gray-300 pl-10 placeholder-gray-500 focus:border-indigo-600 focus:ring-indigo-600"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                      <MagnifyingGlassIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
                <div className="max-w-8xl mx-auto py-3 px-2 sm:px-4">
                  {navigation.map((item) => (
                    <Fragment key={item.id}>
                      <div className="block rounded-md py-2 px-3 text-base font-medium text-gray-900 hover:bg-gray-100">
                        {item.text}
                      </div>

                      {item.children?.map((child) => (
                        <div
                          key={child.id}
                          className="block rounded-md py-2 pl-5 pr-3 text-base font-medium text-gray-500 hover:bg-gray-100"
                        >
                          {child.text}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root> */}
    </div>
  );
}
